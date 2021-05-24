#!/usr/bin/env node

const commander = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const download = require('download-git-repo')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const packageJson = require('./package.json')

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

const runInstall = async (
  cwd,
  callback,
  command = 'npm',
  args = ['install']
) => {
  console.log()
  console.log('Installing dependencies')
  await new Promise((resolve, reject) => {
    const installProcess = spawn(command, args, {
      cwd: cwd || process.cwd(),
      stdio: 'inherit',
      shell: true,
    })
    installProcess.on('exit', () => {
      resolve()
    })
    installProcess.on('error', (err) => {
      console.log(chalk.red('Install dependencies fail'))
      reject(err)
    })
  })
    .then(() => {
      callback()
    })
    .catch((err) => {
      console.log(chalk.red(err))
    })
}

const downloadProject = (projectName) => {
  const root = path.resolve(projectName)
  console.log(`Creating a new react app in ${chalk.green(root)}`)
  console.log()
  const spinner = ora('Downloading react project template')
  spinner.start()
  const downloadPath = `direct:https://github.com/maxiximxx/react-app-template.git`
  download(downloadPath, root, { clone: true }, (err) => {
    if (err) {
      spinner.fail()
      console.log(chalk.red(err))
      process.exit(1)
    }
    spinner.succeed(chalk.green('Download success'))
    const downComplete = () => {
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
    runInstall(root, downComplete)
  })
}

const program = new commander.Command(packageJson.name)
  .version(packageJson.version, '-v, --version')
  .arguments('[project-directory]')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((projectName) => {
    checkProjectName(projectName)
    checkDirExist(projectName)
    downloadProject(projectName)
  })

program.parse(process.argv)
