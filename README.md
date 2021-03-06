<p align="center">
  <img src="https://i.imgur.com/bAaxslQ.png">
</p>

### xHaust

[![Package quality](https://packagequality.com/shield/xhaust.svg)](https://packagequality.com/#?package=xhaust)
[![Build Status](https://travis-ci.org/givemeallyourcats/xhaust.png?branch=master)](https://travis-ci.org/givemeallyourcats/xhaust)
[![Coverage Status](https://coveralls.io/repos/github/GiveMeAllYourCats/xHaust/badge.svg?branch=master)](https://coveralls.io/github/GiveMeAllYourCats/xHaust?branch=master)
[![Licensing](https://img.shields.io/github/license/givemeallyourcats/xhaust.svg)](https://raw.githubusercontent.com/givemeallyourcats/xhaust/master/LICENSE)
[![Repo size](https://img.shields.io/github/repo-size/givemeallyourcats/xhaust.svg)](https://github.com/givemeallyourcats/xhaust)
[![Downloads per week](https://img.shields.io/npm/dw/xhaust.svg)](https://www.npmjs.com/package/xhaust)
[![Node version](https://img.shields.io/node/v/xhaust.svg)](https://www.npmjs.com/package/xhaust)
[![Help us and star this project](https://img.shields.io/github/stars/givemeallyourcats/xhaust.svg?style=social)](https://github.com/givemeallyourcats/xhaust)

#### THIS PROJECT IS NOT YET FINISHED, USE AT OWN RISK.

Also please wait for pull requests as the basis of the application has not yet fully materialized yet.

A fast brute forcer made in Node.js, mostly capable of HTTP attacks. The main mantra of xHaust is **speed, reliability and speed**

#### Installation

```bash
npm install -g xhaust
```

#### Usage

```
Usage: xhaust [options]

Options:
  -V, --version                    output the version number
  -a, --attackUri <attackUri>      URI to attack
  -u, --user <user>                username to use in attack payload (default: "admin")
  -U, --userFile <userFile>        file full of usernames to use in attack payload
  -p, --pass <pass>                password to use in attack payload
  -P, --passFile <passfile>        file full of passwords to use in attack payload (default: "/opt/rockyou.txt")
  -t, --type <type>                payload type to use for this attack (Ex. http-form-post) (default: "web-form-post")
  -i, --input <input>              input configuration for payload (default: "csrf=tokenCSRF")
  -o, --output <output>            output configuration for payload (default: "username=:username:&password=:password:&csrf=:csrf:")
  -l, --maxParallel <maxParallel>  max parallel attack in one batch (default: 80)
  -b, --batchSize <batchSize>      attack batch size length (default: 1000)
  -d, --dryRun                     executes the attack in dry run mode (default: false)
  
  Debug settings                  
  -v, --verbose                    shows all debug messages
  -D, --debugFilter <debugFilter>  filter debug messages
  
  Http settings                   
  -T, --tor                        use tor for all HTTP(s) requests (default: false)
  -s, --socksProxy <socksProxy>    can use a socks5 proxy url. Format: ip:port
  -r, --retries <retries>          amount of retries before marking a http request as failed (default: 6)
  -h, --help                       display help for command                                                                                    
```

##### Example call:

```bash
  $ xhaust -v -a http://127.0.0.1/admin/login -u admin -P /opt/rockyou.txt -t http-form-post
```

#### Project Layout

    .
    ├── ...
    ├── xhaust.js               # Main class file of xHaust, handles most control flow
    ├── entry.js                # Entry file for unit tests, cli or otherwise
    ├── core                    # Core files are xhaust core classes and can listen to various events in the xhaust lifecycle
    ├── payload                 # Payload files are determine specific attack strategies, like a web-form-post one
    ├── logs                    # Log files created by xHaust
    ├── bin                     # Launch file for global npm install
    ├── coverage                # Coverage files
    ├── tests                   # Test folder that holds all test data
    └── ...

#### Design

**xHaust** achieves it's top speed by using the [async](https://caolan.github.io/async/v3/) module, it can execute password tries in parallel with a set limit. Note that Node.js is still single threaded and so is this library. Due to performance reasons the choice to not create multiple threads (or processes for that matter) for this module has been respected, this is because most password tries are finished by the CPU before any other task completes. Be it I/O or network wise.

Consider the following threaded network application:

```
I want to bruteforce: xxxx ──> spawn thread
                                  └──> HTTP Request
                                         └──> HTTP Response
I want to bruteforce: xxxx ──> spawn thread
                                  └──> HTTP Request
                                         └──> HTTP Response
I want to bruteforce: xxxx ──> spawn thread
                                  └──> HTTP Request
                                         └──> HTTP Response
...
...
```

Very costly, instead lets just use the singlethreaded event loop

```
I want to bruteforce: xxxx ──> HTTP request ──> HTTP Response
I want to bruteforce: xxxx ──> HTTP request ──> HTTP Response
I want to bruteforce: xxxx ──> HTTP request ──> HTTP Response
I want to bruteforce: xxxx ──> HTTP request ──> HTTP Response
I want to bruteforce: xxxx ──> HTTP request ──> HTTP Response
...
...
```

this is much faster. Of course if in the future the application will support more protocols and a multi threaded approach is called for; then it will be programmed.

#### Batched brute forcing

`xHaust` uses batched brute forcing, which is just a fancy way of saying it will process x amount of brute force per attack; this can be configured via the `-b, --batchSize <batchSize>`. While this variable is enforced there is also one more into the equation: the `-l, --limitParallel <limitParallel>` parameter. Which ensures only a set amount of requests are active PER batch attack.

Consider the following (unrealistic, because very small sizes) attack parameters:

```
 - parallelLimit: 5
 - batchSize: 10
```

this means for every attack it will process 10 attacks with a limit of running 5 attacks at any time per batch.

```python
# Starts a batch attack of 10
'Bruteforce request #1'  ──>  'Wait for response'
'Bruteforce request #2'  ──>  'Wait for response'
'Bruteforce request #3'  ──>  'Wait for response'
'Bruteforce request #4'  ──>  'Wait for response'
'Bruteforce Results'     <──  'Bruteforce response #1'
'Bruteforce request #5'  ──>  'Wait for response'
'Bruteforce request #6'  ──>  'Wait for response'
# Wait for a request to finish because we hit the parallelLimit
'Bruteforce Results'    <──   'Bruteforce response #2'
'Bruteforce request #7'  ──>  'Wait for response'
'Bruteforce Results'    <──   'Bruteforce response #3'
'Bruteforce Results'    <──   'Bruteforce response #4'
'Bruteforce request #8'  ──>  'Wait for response'
'Bruteforce request #9'  ──>  'Wait for response'
# Wait for a request to finish because we hit the parallelLimit
'Bruteforce Results'    <──   'Bruteforce response #5'
'Bruteforce request #10' ──>  'Wait for response'
'Bruteforce Results'    <──   'Bruteforce response #6'
'Bruteforce Results'    <──   'Bruteforce response #7'
'Bruteforce Results'    <──   'Bruteforce response #8'
'Bruteforce Results'    <──   'Bruteforce response #9'
'Bruteforce Results'    <──   'Bruteforce response #10'
# Batch attack finished, we have all the results.
# Start a new batch attack of 10
# Etc, etc...

```

Two very important variable parameters in `xHaust` that have a big impact on brute force speed.

#### Core files

The power of `xHaust` core files is the ability to easily add any desirable code between events throughout the lifecycle of a `xHaust` instance.

Core files have the ability to 'hook' or subscribe into events of `xHaust`. They are loaded in order given by the mod file author themselfs. The user of `xHaust` chooses what core files to use in what way through specifying through process parameters.

Futher on; when core files hook into these events and the event fires; then `xHaust` will `await` the listeners promises before continuing the program. Making it very easy to hook code into `xHaust` via these so called core files.
