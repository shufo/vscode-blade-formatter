[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/shufo.vscode-blade-formatter)](https://marketplace.visualstudio.com/items?itemName=shufo.vscode-blade-formatter)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/shufo.vscode-blade-formatter)](https://marketplace.visualstudio.com/items?itemName=shufo.vscode-blade-formatter)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/shufo.vscode-blade-formatter)](https://marketplace.visualstudio.com/items?itemName=shufo.vscode-blade-formatter)

# vscode-blade-formatter

An opinionated Blade file formatter for VSCode. Marketplace page is [here](https://marketplace.visualstudio.com/items?itemName=shufo.vscode-blade-formatter).

You can also format by same syntax programmatically with [blade-formatter](https://github.com/shufo/blade-formatter) that this extension relies on.

## Screencast

![Screencast](https://github.com/shufo/vscode-blade-formatter/raw/master/screencast.gif)

## Extension Settings

| setting                                    | description                  | default |
| :----------------------------------------- | :--------------------------- | :------ |
| `Blade Formatter: format Enabled`          | Whether it enables or not    | true    |
| `Blade Formatter: format Indent Size`      | An indent size               | 4       |
| `Blade Formatter: format Wrap Line Length` | The length of line wrap size | 120     |
| `Blade Formatter: format Wrap Attributes`  | The way to wrap attributes. `[auto\|force\|force-aligned\|force-expand-multiline\|aligned-multiple\|preserve\|preserve-aligned]`   | `auto`  |

## TODO

- [ ] Add more option for HTML formatting rules
- [ ] Add option for PHP formatting rules
- [ ] Automate package publishing flow
- [ ] Integration test

## Release Notes

see [CHANGELOG.md](https://github.com/shufo/vscode-blade-formatter/blob/master/CHANGELOG.md)
