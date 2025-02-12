# Talent Protocol Chrome Extension

A Chrome extension that integrates with Talent Protocol to display builder reputation and credentials directly in your browser. Access Talent Passport data and Builder Scores without leaving your current webpage.

## Features

- View Builder Scores and credentials for Talent Protocol users
- Quick access to Talent Passport information via popup interface
- Integration with Talent Protocol's API for reputation data
- Custom styling matching Talent Protocol's brand guidelines

## Structure

- `popup.html` - The extension's popup interface for displaying Talent Protocol data
- `popup.js` - JavaScript logic for fetching and displaying Talent Protocol information
- `content-script.js` - Script for integrating Talent Protocol data into web pages
- `styles.css` - Custom styling following Talent Protocol's design system
- `manifest.json` - Extension configuration and API permissions
- `background.js` - Background script for handling API requests and caching

## Installation

1. Clone this repository or download the files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Development

To modify the extension:

1. Edit `popup.html` and `styles.css` to customize the Talent Protocol UI
2. Modify `popup.js` to change how Talent Protocol data is displayed
3. Update `content-script.js` to adjust webpage integration
4. Configure API authentication in `background.js`
5. Update `manifest.json` for required permissions

## Usage

1. Click the extension icon to view Talent Protocol data in the popup
2. The extension will automatically detect and display Builder Scores and credentials when browsing relevant pages
3. Access detailed Talent Passport information with a single click

## API Integration

This extension uses the Talent Protocol API to fetch:
- Builder Scores
- Talent Passport data
- Credentials and verification status
- Identity and skill information

Note: You'll need to request an API key from Talent Protocol to use this extension.

## Contributing

Feel free to contribute to this project by submitting pull requests or creating issues.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Built with [Talent Protocol](https://talentprotocol.com/) - The professional reputation layer of Web3. 