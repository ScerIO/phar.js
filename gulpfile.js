const gulp = require('gulp'),
      typeScript = require('gulp-typescript')

const arg = (argList => {

  let arg = {},
    opt, thisOpt, curOpt

    argList.forEach((item, index) => {
      thisOpt = item.trim()
      opt = thisOpt.replace(/^\-+/, '')

      if (opt === thisOpt) {
        // argument value
        if (curOpt) arg[curOpt] = opt
        curOpt = null
      } else {
        // argument name
        curOpt = opt
        arg[curOpt] = true

      }
    })

  return arg;
})(process.argv)

const typeScriptProject = typeScript.createProject('tsconfig.json', {
    target: arg.target || 'es6',
    module: arg.module || 'es2015'
  }),
  typeScriptProjectTest = typeScript.createProject('./test/tsconfig.json')

function build() {
  return typeScriptProject
    .src()
    .pipe(typeScriptProject())
    .pipe(gulp.dest(`lib/${arg.module}`))
}

function buildTests() {
  return gulp
    .src(['test/src/**/*.ts'])
    .pipe(typeScriptProjectTest())
    .pipe(gulp.dest(`test/build`))
}

gulp.task('build', build)

gulp.task('build:test', buildTests)

gulp.task('watching', () => {
  gulp.watch('test/src/**/*.ts', buildTests)
  gulp.watch(['src/**/*.ts', 'src/**/*.js'], build)
})
