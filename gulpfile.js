'use strict';

const gulp       = require('gulp')
	, clean      = require('gulp-clean')
	, cleanhtml  = require('gulp-cleanhtml')
	, minifycss  = require('gulp-minify-css')
	, jshint     = require('gulp-jshint')
	, stripdebug = require('gulp-strip-debug')
	, uglify     = require('gulp-uglify')
	, zip        = require('gulp-zip')
	;

// Clean build directory
gulp.task('clean', function() {
	return gulp.src('build/*', {read: false})
		.pipe(clean());
});

// Copy static folders to build directory
gulp.task('copy', function() {
	return gulp.src([
		'src/style/fonts/**'
		, 'src/icons/**'
		, 'src/js/ext/**'
		, 'src/style/ext/**'
		, 'src/manifest.json'
	], { base : './src' } )
	.pipe(gulp.dest('build'));
});

// Copy and compress HTML files
gulp.task('html', function() {
	return gulp.src('src/*.html')
		.pipe(cleanhtml())
		.pipe(gulp.dest('build'));
});

// Run scripts through JSHint
gulp.task('jshint', function() {
	return gulp.src('src/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

// Copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('scripts', ['jshint'], function() {
	return gulp.src('src/js/*.js')
		.pipe(stripdebug())
		.pipe(uglify())
		.pipe(gulp.dest('build/js'));
});

// Minify styles
gulp.task('styles', function() {
	return gulp.src('src/style/**.css')
		.pipe(minifycss({root: 'src/style', keepSpecialComments: 0}))
		.pipe(gulp.dest('build/style'));
});

// Build ditributable and sourcemaps after other tasks completed
gulp.task('zip', ['html', 'scripts', 'styles', 'copy'], function() {
	var manifest = require('./src/manifest'),
		distFileName = manifest.name + ' v' + manifest.version + '.zip';
	// Build distributable extension
	return gulp.src('build/**')
		.pipe(zip(distFileName))
		.pipe(gulp.dest('dist'));
});

// Run all tasks after build directory has been cleaned
gulp.task('build', ['clean'], function() {
	gulp.start('zip');
});
