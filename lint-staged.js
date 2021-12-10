// From https://blog.logrocket.com/build-robust-react-app-husky-pre-commit-hooks-github-actions/ [accessed 10 Dec 2021]
module.exports = {
    '*.{js,jsx,ts,tsx}': [
        'eslint --max-warnings=0',
        'react-scripts test --bail --watchAll=false --findRelatedTests --passWithNoTests',
        () => 'tsc-files --noEmit'
    ]
};
