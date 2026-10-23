# ErgExplorer

Ergo blockchain explorer website (static, built with gulp and Nunjucks).

- Domain: ergexplorer.com
- Live branch: main
- Ships via: deployer key `ergexplorer` / local build, then rsync of `dist/`
- Local dev: `npm ci --ignore-scripts && npx gulp serve` (serves on localhost:9000); `npx gulp build` for a production build
