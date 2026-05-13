const fs = require('fs/promises');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const gulpLoadPlugins = require('gulp-load-plugins');
const sass = require("gulp-sass")(require('sass'));

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

function clean() {
	return Promise.all([
		fs.rm('.tmp', {force: true, recursive: true}),
		fs.rm('dist', {force: true, recursive: true})
	]);
}

function doserve() {
    browserSync.init({
      notify: false,
      port: 9004,
      server: {
        baseDir: ['.tmp', 'app'],
		serveStaticOptions: {
            extensions: ['html']
        }
      }
    });

    gulp.watch([
      'app/*.html',
      'app/images/**/*',
      'app/styles/**/*.css',
      '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/**/*.njk', gulp.series(nunjucks));
    gulp.watch('app/styles/**/*.scss', gulp.series(styles));
    gulp.watch('app/styles/**/*.css', gulp.series(stylescss));
    gulp.watch('app/scripts/*.js', gulp.series(scripts));
    gulp.watch('app/fonts/**/*', gulp.series(fonts));
}

function html() {
	return gulp.src('app/*.html')
	    .pipe($.htmlmin({
	      collapseWhitespace: true,
	      minifyCSS: true,
	      minifyJS: {compress: {drop_console: true}},
	      processConditionalComments: true,
	      removeComments: true,
	      removeEmptyAttributes: true,
	      removeScriptTypeAttributes: true,
	      removeStyleLinkTypeAttributes: true
	    }))
	    .pipe(gulp.dest('dist'));
}

function nunjucks() {
	return gulp.src('app/pages/**/*.+(html|njk)')
		.pipe($.nunjucksRender({
			path: ['app/templates']
		}))
		.pipe(gulp.dest('app'))
}

function styles() {
	return gulp.src('app/styles/**/*.scss')
		.pipe($.plumber())
	    .pipe(sass.sync({
	      outputStyle: 'expanded',
	      precision: 10,
	      includePaths: ['.']
	    }).on('error', sass.logError))
		.pipe($.autoprefixer())
		.pipe(gulp.dest('.tmp/styles'))
		.pipe(reload({stream: true}));
}

function scripts() {
	return gulp.src('app/scripts/*.js')
	    .pipe($.plumber())
	    .pipe($.babel())
	    .pipe(gulp.dest('.tmp/scripts'))
	    .pipe(reload({stream: true}));
}

function scriptsbuild() {
 	return gulp.src(['app/scripts/**/*.js', '!app/scripts/common/token-icons.js'])
    	.pipe($.terser({compress: {drop_console: true}}))
    	.pipe(gulp.dest('dist/scripts'));
}

function scriptsmove() {
	return gulp.src('app/scripts/common/token-icons.js')
    	.pipe(gulp.dest('dist/scripts/common'));
}

function images() {
	return gulp.src('app/images/**/*', {encoding: false})
    	.pipe(gulp.dest('dist/images'));
}

function fonts() {
	return gulp.src('app/fonts/*', {encoding: false})
    	.pipe(gulp.dest('dist/fonts'));
}

function stylescssApp() {
	return gulp.src('app/styles/**/*.css')
		.pipe($.cleanCss())
		.pipe(gulp.dest('dist/styles'));
}

function stylescssCompiled() {
	return gulp.src('.tmp/styles/**/*.css')
		.pipe($.cleanCss())
		.pipe(gulp.dest('dist/styles'));
}

const stylescss = gulp.parallel(stylescssApp, stylescssCompiled);

function extras() {
	return gulp.src([
    	'app/*',
    	'!app/*.html'
	], {
		encoding: false,
 		dot: true
	}).pipe(gulp.dest('dist'));
}

exports.clean = clean;
exports.scripts = scripts;
exports.images = images;
exports.fonts = fonts;
exports.doserve = doserve;
exports.nunjucks = nunjucks;
exports.html = html;
exports.styles = styles;
exports.stylescss = stylescss;
exports.extras = extras;
exports.scriptsbuild = scriptsbuild;

exports.serve = gulp.series(clean, nunjucks, styles, stylescss, scripts, fonts, doserve);
exports.build = gulp.series(clean, nunjucks, styles, stylescss, scripts, html, images, fonts, stylescss, scriptsbuild, scriptsmove, extras);
