# Contributing guidelines

## Pull Request Checklist

Before sending your pull requests, make sure you followed this list.

- Read [contributing guidelines](CONTRIBUTING.md).
- Read [Code of Conduct](CODE_OF_CONDUCT.md).
- Changes are consistent with the [Coding Style](https://thisdoesnotexistyet.com).
- Run [Unit Tests](https://thisdoesnotexistyet.com).

## How to become a contributor and submit your own code

### Contributing code

If you have improvements to xHaust, send us your pull requests! For those
just getting started, Github has a
[how to](https://help.github.com/articles/using-pull-requests/).

xHaust team members will be assigned to review your pull requests. Once the
pull requests are approved and pass continuous integration checks, a xHaust
team member will apply `ready to pull` label to your change. This means we are
working on getting your pull request submitted to our internal repository. After
the change has been submitted internally, your pull request will be merged
automatically on GitHub.

If you want to contribute, start working through the xHaust codebase, navigate to the
[Github "issues" tab](https://github.com/givemeallyourcats/xhaust/issues) and start
looking through interesting issues. If you decide to start on an issue, leave a comment 
so that other people know that you're working on it. If you want to help out, but not 
alone, use the issue comment thread to coordinate.

### Contribution guidelines and standards

Before sending your pull request for
[review](https://github.com/givemeallyourcats/xhaust/pulls),
make sure your changes are consistent with the guidelines and follow the
xHaust coding style.

#### General guidelines and philosophy for contribution

*   Include unit tests when you contribute new features, as they help to a)
    prove that your code works correctly, and b) guard against future breaking
    changes to lower the maintenance cost.
*   Bug fixes also generally require unit tests, because the presence of bugs
    usually indicates insufficient test coverage.
*   Keep API compatibility in mind when you change code in core xHaust (especially the event system).
*   When you contribute a new feature to xHaust, the maintenance burden is
    (by default) transferred to the xHaust team. This means that the benefit
    of the contribution must be compared against the cost of maintaining the
    feature.

#### License

All your submitted code will fall under the [MIT License](LICENSE) which xHaust also falls under.
