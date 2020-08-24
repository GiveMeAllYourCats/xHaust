<p align="center">
  <img src="https://i.imgur.com/bAaxslQ.png">
</p>

### xHaust

[![HitCount](http://hits.dwyl.com/GiveMeAllYourCats/xHaust.svg)](http://hits.dwyl.com/GiveMeAllYourCats/xHaust)
[![Package quality](https://packagequality.com/shield/xhaust.svg)](https://packagequality.com/#?package=xhaust)
[![Build Status](https://travis-ci.org/givemeallyourcats/xhaust.png?branch=master)](https://travis-ci.org/givemeallyourcats/xhaust)
[![Coverage Status](https://coveralls.io/repos/github/GiveMeAllYourCats/xHaust/badge.svg?branch=master)](https://coveralls.io/github/GiveMeAllYourCats/xHaust?branch=master)
[![Licensing](https://img.shields.io/github/license/givemeallyourcats/xhaust.svg)](https://raw.githubusercontent.com/givemeallyourcats/xhaust/master/LICENSE)
[![Repo size](https://img.shields.io/github/repo-size/givemeallyourcats/xhaust.svg)](https://github.com/givemeallyourcats/xhaust)
[![Downloads per week](https://img.shields.io/npm/dw/xhaust.svg)](https://www.npmjs.com/package/xhaust)
[![Node version](https://img.shields.io/node/v/xhaust.svg)](https://www.npmjs.com/package/xhaust)
[![Help us and star this project](https://img.shields.io/github/stars/givemeallyourcats/xhaust.svg?style=social)](https://github.com/givemeallyourcats/xhaust)

A fast brute forcer made in Node.js, mostly capable of HTTP attacks. The main mantra of xHaust is **speed, reliability and speed**

**xHaust** achieves it's top speed by using the [async](https://caolan.github.io/async/v3/) module, it can execute password tries in parallel with a set limit. Note that Node.js is still single threaded and so is this library. Due to performance reasons the choice to not create multiple threads for this module has been respected, this is because most password tries are finished by the CPU before any other task completes and the CPU can easily exhaust (heh) request speeds before the requests can exhaust the CPU, making threads costly for this kind of goal.

# THIS PROJECT IS NOT YET FINISHED, PLEASE COME BACK LATER

#### Installation

```bash
npm install -g xhaust
```

#### Usage

```
Usage: xhaust [options]

Options:
  -V, --version                        output the version number
  -a, --attackUri <attackUri>          protocol URI to attack
  -u, --user <user>                    username to use in attack payload
  -U, --userFile <userfile>            file full of usernames to use in attack payload
  -p, --pass <pass>                    password to use in attack payload
  -P, --passFile <passfile>            file full of passwords to use in attack payload
  -l, --limitParallel <limitParallel>  max parallel requests at a time
  -b, --batchSize <batchSize>          the get and post requests batch size
  -d, --dryRun <dryRun>                executes the attack in dry run mode
  -T, --test                           run attack on in built local http server for testing
  -v, --verbose                        Shows all debug messages
  -D, --debugFilter <debugFilter>      Filter debug messages
  -t, --tags <tags>                    tags to use for this attack seperated by hypens (Ex. http-post-urlencoded)
  -i, --input <input>                  input string to use as first scan structure data (Ex. form input names configurations)
  -o, --output <output>                output string to use as payload for attack, will replace :username: :password: and :csrf: with respectable values
  -g, --useGui                         enable gui
  -h, --help                           display help for command
```

##### Example call:

```bash
  $ xhaust -t -a http://somewebsite.com http-post-urlencoded -u admin -P passwords.txt -s 1000 -l 130 -i "csrf=token" -o "username=:username:&password=:password:&csrftoken=:csrf:"`
```

#### Project Layout

    .
    ├── ...
    ├── xhaust.js               # Main class file of xHaust, handles most control flow
    ├── entry.js                # Entry file for unit tests, cli or otherwise
    ├── tags                    # Tag files are to be seen as middleware files between various events in the xhaust lifecycle
    ├── classes                 # Any class files that are not instanced automatically by xHaust
    ├── logs                    # Log files created by xHaust
    ├── metadata                # Metadata folder stores arbitrary data for example attack files
    ├── modules                 # A simple module object that performs basic tasks
    ├── packages                # Packages are classes that are imported and instanced by xHaust and are the internal workings
    ├── tests                   # Test folder that holds all test data
    └── ...
