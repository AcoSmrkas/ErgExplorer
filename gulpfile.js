const del = require('del');
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const gulpLoadPlugins = require('gulp-load-plugins');
const sass = require("gulp-sass")(require('sass'));

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var dev = true;

function clean() {
	return del(['.tmp', 'dist']);
}

function doserve() {
    browserSync.init({
      notify: false,
      port: 9004,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        },
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
    gulp.watch('bower.json', gulp.series(dowiredepcss, dowiredephtml, fonts));
}

function dowiredepcss() {
	return gulp.src('app/styles/**/*.scss')
	    .pipe($.filter(file => file.stat && file.stat.size))
	    .pipe($.wiredep({
	      ignorePath: /^(\.\.\/)+/
	    }))
	    .pipe(gulp.dest('app/styles'));
}

function dowiredephtml() {
	return gulp.src('app/*.html')
	    .pipe($.wiredep({
	      exclude: ['bootstrap-sass'],
	      ignorePath: /^(\.\.\/)*\.\./
	    }))
	    .pipe(gulp.dest('app'));
}

function html() {
	return gulp.src('app/*.html')
    	.pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
		.pipe($.if(/\.js$/, $.terser({compress: {drop_console: true}})))
	    .pipe($.if(/\.css$/, $.cssnano({safe: true, autoprefixer: false})))
	    .pipe($.if(/\.html$/, $.htmlmin({
	      collapseWhitespace: true,
	      minifyCSS: true,
	      minifyJS: {compress: {drop_console: true}},
	      processConditionalComments: true,
	      removeComments: true,
	      removeEmptyAttributes: true,
	      removeScriptTypeAttributes: true,
	      removeStyleLinkTypeAttributes: true
	    })))
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
		.pipe($.if(dev, $.sourcemaps.init()))
	    .pipe(sass.sync({
	      outputStyle: 'expanded',
	      precision: 10,
	      includePaths: ['.']
	    }).on('error', sass.logError))
		.pipe($.autoprefixer())
		.pipe($.if(dev, $.sourcemaps.write()))
		.pipe(gulp.dest('.tmp/styles'))
		.pipe(reload({stream: true}));
}

function lint() {
	return doLint('app/scripts/**/*.js')
		.pipe(gulp.dest('app/scripts'));
}

function doLint(files) {
  return gulp.src(files)
   .pipe($.eslint({ fix: true }))
   .pipe(reload({stream: true, once: true}))
   .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

function scripts() {
	return gulp.src('app/scripts/*.js')
	    .pipe($.plumber())
	    .pipe($.if(dev, $.sourcemaps.init()))
	    .pipe($.babel())
	    .pipe($.if(dev, $.sourcemaps.write('.')))
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
    	.pipe(($.cache($.imagemin())))
    	.pipe(gulp.dest('dist/images'));
}

function fonts() {
	return gulp.src('app/fonts/*', {encoding: false})
    	.pipe(gulp.dest('dist/fonts'));
}

function stylescss() {
	return gulp.src('app/styles/**/*.css')
    	.pipe(gulp.dest('dist/styles'));
}

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
exports.dowiredepcss = dowiredepcss;
exports.dowiredephtml = dowiredephtml;
exports.nunjucks = nunjucks;
exports.html = html;
exports.styles = styles;
exports.stylescss = stylescss;
exports.extras = extras;
exports.scriptsbuild = scriptsbuild;

exports.serve = gulp.series(clean, dowiredepcss, dowiredephtml, nunjucks, styles, stylescss, scripts, fonts, doserve);
exports.build = gulp.series(clean, nunjucks, styles, stylescss, scripts, html, images, fonts, stylescss, scriptsbuild, scriptsmove, extras);