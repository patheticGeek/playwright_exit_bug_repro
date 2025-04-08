### Issue

When running playwright with all handle signal disabled, the browser should not exit until asked to.

But it is throwing with error soon as it gets a SIGINT
```
page.goto: net::ERR_ABORTED at https://example.com/3
# or
page.goto: Target page, context or browser has been closed
```

I am running it with pm2 to show this easier and also as my usecase is around it.

### Reproduction

1. Install deps, i am using pnpm so `pnpm i`
2. Start the script with `pnpm start` which will start the process with pm2
3. In another terminal run `pnpm kill` which will try to stop the running process

Sample log:

```
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> init
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> signal: SIGINT
0|playwrig | process exited
0|playwrig | Playwright -> newPage
0|playwrig | Playwright -> init

0|playwright_exit_test  | Playwright -> newPage
0|playwright_exit_test  | Playwright -> newPage
0|playwright_exit_test  | Playwright -> newPage
0|playwright_exit_test  | Playwright -> signal: SIGINT
0|playwright_exit_test  | page.goto: net::ERR_ABORTED at https://example.com/3
0|playwright_exit_test  | Call log:
0|playwright_exit_test  |   - navigating to "https://example.com/3", waiting until "networkidle"
0|playwright_exit_test  |     at main (/home/work/git/playwright_exit_bug_repro/index.js:60:16) {
0|playwright_exit_test  |   name: 'Error'
0|playwright_exit_test  | }
0|playwright_exit_test  | process exited
```

#### What should happen:

Playwright keeps loading pages and the browser only closes on the cleanup call

#### What happens

The goto is interrupted by a err aborted, also page.content/evaluate would also fail if recieved kill signal with error

```
page.evaluate: Target page, context or browser has been closed
```
