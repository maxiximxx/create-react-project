#!/usr/bin/env node

const commander = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const inquirer = require('inquirer')
const download = require('download-git-repo')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const packageJson = require('./package.json')

const questions = [
  {
    type: 'list',
    choices: ['JavaScript', 'TypeScript'],
    name: 'template',
    message: 'Please select the project template',
  },
  {
    name: 'author',
    message: 'Please enter the author name: ',
  },
  {
    name: 'description',
    message: 'Please enter the project description: ',
  },
  {
    name: 'version',
    message: 'Please enter the project version: ',
    default: '1.0.0',
    validate(value) {
      const pass = value.match(/^\d{1,2}\.\d{1,2}\.\d{1,2}$/)
      if (pass) {
        return true
      }
      return 'Please enter a valid version (format 1.0.0)'
    },
  },
]

const checkDirExist = (projectName) => {
  if (fs.existsSync(projectName)) {
    console.log(chalk.red(`${projectName} has exist in this directory`))
    process.exit(1)
  }
}

const checkProjectName = (projectName) => {
  if (typeof projectName === 'undefined') {
    console.log(`${chalk.red('Please specify the project directory')}`)
    console.log(
      `  ${chalk.cyan(packageJson.name)} ${chalk.green('<project-directory>')}`
    )
    console.log()
    console.log('For example:')
    console.log(
      `  ${chalk.cyan(packageJson.name)} ${chalk.green('my-react-app')}`
    )
    console.log()
    console.log(
      `Run ${chalk.cyan(`${packageJson.name} --help`)} to see all options.`
    )
    process.exit(1)
  }
}

const initProject = () =>
  new Promise((resolve, reject) => {
    inquirer
      .prompt(questions)
      .then((answers) => resolve(answers))
      .catch((error) => {
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else went wrong
        }
        reject('Init project fail, please retry')
        process.exit(1)
      })
  })

const runInstall = (cwd, onComplete, command = 'npm', args = ['install']) => {
  return new Promise((resolve, reject) => {
    const installProcess = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
      shell: true,
    })
    installProcess.on('exit', () => {
      onComplete && onComplete()
      resolve(true)
    })
    installProcess.on('error', (err) => {
      console.log(chalk.red(err))
      reject(err)
    })
  })
}

const installGit = async (root) => {
  const onComplete = () => {
    console.log()
    console.log(`${chalk.green('Git initial success')}`)
  }
  await runInstall(root, onComplete, 'git', ['init'])
}

const installDependencies = (root, projectName) => {
  const onComplete = () => {
    console.log()
    console.log(`${chalk.green('React project initial success')}`)
    console.log()
    console.log(`  ${chalk.cyan(`cd ${projectName}`)}`)
    console.log()
    console.log(`  ${chalk.cyan('npm run start')}`)
    console.log('    Start the node server')
    console.log()
    console.log(`  ${chalk.cyan('npm run dev')}`)
    console.log('    Start the development server')
    console.log()
    console.log(`  ${chalk.cyan('npm run build')}`)
    console.log('    Bundle the app into static files for production')
  }
  console.log()
  console.log('Installing dependencies')
  runInstall(root, onComplete)
}

const downloadProject = (projectName, initParams) => {
  const { template, author, description, version } = initParams
  const root = path.resolve(projectName)
  console.log(`Creating a new react app in ${chalk.green(root)}`)
  console.log()
  const spinner = ora(`Downloading react project with ${template} template`)
  spinner.start()
  const branch = template === 'JavaScript' ? 'master' : 'ts'
  const downloadPath = `direct:https://github.com/maxiximxx/react-app-template.git#${branch}`
  download(downloadPath, root, { clone: true }, async (err) => {
    if (err) {
      spinner.fail()
      console.log(chalk.red(err))
      process.exit(1)
    }
    const pkg = `${projectName}/package.json`
    if (fs.existsSync(pkg)) {
      const data = fs.readFileSync(pkg).toString()
      const json = JSON.parse(data)
      json.name = projectName
      json.author = author || json.author
      json.description = description || json.description
      json.version = version
      fs.writeFileSync(pkg, JSON.stringify(json, null, '\t'), 'utf-8')
    }
    spinner.succeed(chalk.green('Download success'))

    await installGit(root)
    installDependencies(root, projectName)
  })
}

const program = new commander.Command(packageJson.name)
  .version(packageJson.version, '-v, --version')
  .arguments('[project-directory]')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((projectName) => {
    checkProjectName(projectName)
    checkDirExist(projectName)
    initProject()
      .then((initParams) => {
        downloadProject(projectName, initParams)
      })
      .catch((err) => {
        console.log(`${chalk.red(err)}`)
      })
  })

program.parse(process.argv)
