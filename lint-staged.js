// From https://blog.logrocket.com/build-robust-react-app-husky-pre-commit-hooks-github-actions/ [accessed 10 Dec 2021]
module.exports = {
    '*.js': [
        'npm test'
    ]
};
