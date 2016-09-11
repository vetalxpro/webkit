"use strict";

var gulp = require('gulp'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync'),
    newer = require('gulp-newer'),
    cache = require('gulp-cache'),
    sourcemaps = require('gulp-sourcemaps'),
    size = require('gulp-size'),
    imagemin = require('gulp-imagemin'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    cssnano = require('cssnano'),
    pug = require('gulp-pug'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-clean-css'),
    del = require('del'),
    wiredep = require('wiredep').stream,
    sftp = require('gulp-sftp');

const reload = browserSync.reload;

//------------------------PATHS----------------------------------

var paths = {
  scripts: ['app/scripts/**/*.js'],
  styles: ['app/styles/scss/**/*.scss'],
  html: ['app/html/index.html'],
  jade: ['app/jade/*.pug'],
  images: ['app/images/**/*.{jpg,png,gif}'],
  fonts: ['app/fonts/*'],
  icons: ['app/icons/*']
};

//----------------- SASS -------------------------
const AUTOPREFIXER_BROWSERS = [
  'ie >= 9',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 10',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var beforeProcessors = [
  autoprefixer(AUTOPREFIXER_BROWSERS)
];
var afterProcessors = [
  cssnano()
];

gulp.task('css', function () {
  return gulp.src(paths.styles)
      .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'expanded'
      }).on('error', sass.logError))
      .pipe(postcss(beforeProcessors))
      .pipe(gulp.dest('app/styles/css'))
      .pipe(postcss(afterProcessors))
      .pipe(size({title: 'css'}))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('app/.tmp/css'));
});


//-------------------------JADE(+wiredep)-------------------------

gulp.task('jade', function () {
  return gulp.src(paths.jade)
      .pipe(pug({
        pretty: true
      }))
      .pipe(gulp.dest('app/.tmp'))
      .pipe(wiredep({
        direcory: 'app/bower_components'
      }))
      .pipe(size({title: 'jade'}))
      .pipe(gulp.dest('app/.tmp'));

});

//-------------------------JS-------------------------

gulp.task('scripts', function () {
  return gulp.src(paths.scripts)
      .pipe(gulp.dest('app/.tmp/scripts'))
      .pipe(size({title: 'scripts'}));

});

//--------------------copy-res-------------------------

gulp.task('copy', ['optimize-images'], function (cb) {
  gulp.src(paths.fonts)
      .pipe(newer('app/.tmp/fonts'))
      .pipe(size({title: 'fonts'}))
      .pipe(gulp.dest('app/.tmp/fonts'));

  gulp.src(paths.icons)
      .pipe(newer('app/.tmp/icons'))
      .pipe(size({title: 'icons'}))
      .pipe(gulp.dest('app/.tmp/icons'));
  gulp.src('app/*')
      .pipe(newer('app/.tmp'))
      .pipe(size({title: 'ico'}))
      .pipe(gulp.dest('app/.tmp'));
  cb();
});

// Optimize images
gulp.task('optimize-images', function () {
  gulp.src('app/images/**/*')
      .pipe(cache(imagemin({
        progressive: true,
        interlaced: true
      })))
      .pipe(gulp.dest('app/.tmp/images'))
      .pipe(size({title: 'images'}));
});


//---------------------------BROWSER-SYNC----------------------

function hello() {
  console.log('Ready for work ;)');
}

gulp.task('serve:tmp', function (cb) {
  browserSync({
    server: {
      baseDir: 'app/.tmp',
      routes: {
        "/bower_components": "app/bower_components"
      }
    },
    // proxy: "localhost:8888"
    // files: ["app/*.html", "app/css/*.css", "app/js/*.js"]
    port: 8769,
    // logConnections: true,
    ui: {
      port: 8770
    },
    open: 'local',
    notify: true
  }, hello);
  gulp.watch([paths.images, paths.fonts, paths.icons], ['copy', reload]);
  gulp.watch([paths.styles], ['css', reload]);
  gulp.watch(['app/jade/**/*.pug'], ['jade', reload]);
  gulp.watch(paths.scripts, ['scripts', reload]);

  cb();


});

gulp.task('serve:dist', function (cb) {
  browserSync({
    server: {
      baseDir: 'dist'
    },
    // proxy: "localhost:8888"
    port: 8779,
    ui: {
      port: 8780
    },
    // logConnections: true,
    open: 'local',
    notify: true
  });
  cb();
});


//============================== BUILD and DEPLOY =====================================

// Delete the dist directory
gulp.task('clean', function () {
  return del.sync('dist/**/*');
});




gulp.task('build : dist', ['clean'], function () {

  gulp.src(paths.images)
      .pipe(size({
        title: 'images'
      }))
      .pipe(gulp.dest('dist/images'));

  gulp.src(paths.fonts)
      .pipe(size({
        title: 'fonts'
      }))
      .pipe(gulp.dest('dist/fonts'));

  gulp.src(paths.icons)
      .pipe(size({
        title: 'icons'
      }))
      .pipe(gulp.dest('dist/icons'));
  gulp.src('app/*')
      .pipe(size({
        title: 'root files'
      }))
      .pipe(gulp.dest('dist'));

  return gulp.src('app/.tmp/*.html')
      .pipe(useref())
      .pipe(gulpif('*.js', uglify()))
      .pipe(gulpif('*.css', minifyCss()))
      .pipe(size({
        showFiles: true,
        title: 'main files'
      }))
      .pipe(gulp.dest('dist'));
});

gulp.task('sftp', function () {
  return gulp.src('dist/**/*')
      .pipe(sftp({
        host: '',
        user: '',
        pass: ''
      }));
});

//==================================================================


gulp.task('default', function () {
  runSequence(['css', 'jade', 'scripts', 'copy'], 'serve:tmp');
});
