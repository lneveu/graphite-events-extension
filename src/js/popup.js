(function($)
{
	"use strict";
	$(document).ready(function()
	{
		/**
		 * TABS & HEADERS
		 */
		var $header         = $('.header_container')
			, $headNewEvent = $('#header_tab_new-event')
			, $headSettings = $('#header_tab_settings')
			, $tabSettings  = $('#tab_settings')
			, $tabNewEvent  = $('#tab_new-event')
			// current tab and header
			, $currentTab   = $tabNewEvent
			, $currentHead  = $headNewEvent
			// global functions
			, switchTab = function(tab)
			{
				$currentTab.hide();
				$currentHead.removeClass('active');
				switch (tab)
				{
					case 'new-event' :
						$currentTab = $tabNewEvent;
						$currentHead = $headNewEvent;
						break;
					case 'settings' :
						$currentTab = $tabSettings;
						$currentHead = $headSettings;
						break;
					default:
						break;
				}
				$currentTab.show();
				$currentHead.addClass('active');
			}
			, getSettings = function(cb)
			{
				chrome.storage.sync.get('graphiteEventSettings', function(settings)
				{
					settings = settings.graphiteEventSettings;
					// check settings
					if(typeof settings === 'undefined'
						|| typeof settings.host !== 'string' || settings.host === ''
						|| typeof settings.username !== 'string' || settings.username === ''
						|| typeof settings.password !== 'string' || settings.password === '')
					{
						settings = null;
					}
					cb(settings);
				});
			}
			;

		// tab switcher
		$header.on('click', '.header_tab', function()
		{
			var targetTab = $(this).attr('data-tab');
			if(targetTab === $currentTab.attr('data-tab')) { return; }
			switchTab(targetTab);
		});

		/**
		 * NEW EVENT TAB
		 */
		var newEventTAB =
		{
			timepicker     : $('#event_timepicker')[0].flatpickr({ enableTime : true, defaultDate : new Date() })
			, tags         : new Taggle('event_tags', { placeholder : 'Enter tags separated by space...', submitKeys : [188, 13, 32] })
			, $eventDesc   : $('#event_what')
			, $btnCreate   : $('#btn_create_event')
			, $loader      : $('#form_new-event .loader')
			, $spanError   : $('#form_new-event .form-error')
			, $spanSuccess : $('#form_new-event .form-success')
		};

		// on create event
		newEventTAB.$btnCreate.on('click', function()
		{
			// hide spans info
			newEventTAB.$spanError.hide();
			newEventTAB.$spanSuccess.hide();

			// check inputs
			if(newEventTAB.$eventDesc.val() === '' || typeof newEventTAB.timepicker.selectedDates[0] === 'undefined' || newEventTAB.tags.getTagValues().length === 0)
			{
				newEventTAB.$spanError.html('Please fill all the fields').show();
				return;
			}

			getSettings(function(settings)
			{
				// check settings
				if(settings === null)
				{
					newEventTAB.$spanError.html('Please configure Graphite settings').show();
					return;
				}

					// prepare data
				var data  =
				{
					what   : newEventTAB.$eventDesc.val()
					, when : newEventTAB.timepicker.selectedDates[0].getTime() / 1000 // unix time
					, tags : newEventTAB.tags.getTagValues().join(',')
				};

				newEventTAB.$loader.show();

				// send ajax request
				$.ajax({
					url : 'http://' + settings.username  + ':' + settings.password + '@' + settings.host + '/events/'
					, type : 'POST'
					, data : JSON.stringify(data)
					, error : function(res, status)
					{
						newEventTAB.$loader.hide();
						newEventTAB.$spanError.html('An error occurred (' + status + ')').show();
					}
					, success : function()
					{
						newEventTAB.$loader.hide();
						newEventTAB.$spanSuccess.html('Event created!').show();

						// clean form
						newEventTAB.timepicker.clear();
						newEventTAB.$eventDesc.val('');
						newEventTAB.tags.removeAll();

						setTimeout(function()
						{
							newEventTAB.$spanSuccess.hide();
						}, 3000);
					}
				});
			});
		});


		/** SETTINGS TAB */
		var settingsTAB =
		{
			$host          : $('#setting_host')
			, $user        : $('#setting_username')
			, $password    : $('#setting_password')
			, $saveBtn     : $('#setting_save_btn')
			, $editBtn     : $('#setting_edit_btn')
			, $spanError   : $('#form_settings .form-error')
			, $spanSuccess : $('#form_settings .form-success')
			, editMode  : function()
			{
				this.$host.removeAttr('readonly');
				this.$user.removeAttr('readonly');
				this.$password.val('').removeAttr('readonly');
				this.$saveBtn.show();
				this.$editBtn.hide();
			}
			, viewMode : function(settings)
			{
				if(settings)
				{
					this.$host.val(settings.host);
					this.$user.val(settings.username);
				}
				this.$host.attr('readonly', true);
				this.$user.attr('readonly', true);
				this.$password.val('********').attr('readonly', true);
				this.$saveBtn.hide();
				this.$editBtn.show();
			}
		};

		// init from localstorage
		getSettings(function(settings)
		{
			if(settings !== null)
			{
				settingsTAB.viewMode(settings);
			}
			else
			{
				settingsTAB.editMode();
			}
		});

		// edit settings
		settingsTAB.$editBtn.on('click', function()
		{
			settingsTAB.editMode();
		});

		// update settings
		settingsTAB.$saveBtn.on('click', function()
		{
			// hide spans info
			settingsTAB.$spanError.hide();
			settingsTAB.$spanSuccess.hide();

			// check inputs
			if(settingsTAB.$host.val() === '' || settingsTAB.$user.val() === '' || settingsTAB.$password.val() === '')
			{
				settingsTAB.$spanError.html('Please fill all the fields').show();
				return;
			}

			var data  =
			{
				host       : settingsTAB.$host.val().replace(/.*?:\/\//g, "")
				, username : settingsTAB.$user.val()
				, password : settingsTAB.$password.val()
			};

			settingsTAB.viewMode();

			chrome.storage.sync.set({ 'graphiteEventSettings' : data }, function()
			{
				settingsTAB.$spanSuccess.html('Saved!').show();
				setTimeout(function()
				{
					settingsTAB.$spanSuccess.hide();
				}, 3000);
			});
		});
	});
}(Zepto));
