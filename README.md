# CryptoGuard — Demo Crypto Platform

A self-contained **demo** crypto platform (admin panel + user dashboard) for testing.
No real funds, no real blockchain, no real bank — everything is simulated.

**Stack:** Node.js + Express + SQLite (a local file). No database server, no cloud
account, no IP whitelist, no internet needed to run it (internet is only used for
live coin prices and logos, and the app still works without it).

## Run it

```bash
npm install
npm start
```

Open **http://localhost:4000**. That's it — there is nothing else to set up.
The database is created automatically at `data/cryptoguard.db`.

- Admin login: `admin` / `admin123` (change in `.env` — optional, see `.env.example`)
- Requires Node.js 18+ (Node 22+ recommended)
- Start fresh any time: stop the server and delete the `data/` folder
- Back up everything: copy `data/cryptoguard.db`

## Pages

| URL | What |
|---|---|
| `/` | Chooser: user login or admin login |
| `/user-login.html` | User login **and** "Create Account" (self-signup) |
| `/admin-login.html` | Admin login |

## Admin

- **Create users** (name, email, phone, country → auto-generated username & password, shown once)
- **Manage users**: edit profile, reset password, set/override balances
- **Open Dashboard** (one click, in Manage Users): opens that user's real dashboard
  in a new tab with an "Admin view" banner. Your admin login stays untouched.
- **Credit** USD or any crypto, choosing the coin **and network** — every credit
  shows up in the user's history as a deposit with date, time and network
- **Withdrawal requests**: approve, or reject with a written reason (the user sees it
  on their dashboard; held funds are returned automatically)
- **Deposit addresses**: paste a demo wallet address per coin/network
- **Support settings**: email + WhatsApp shown on users' Support page
- **Overview**: totals plus live market prices for every coin

## User

- Dashboard: balances, holdings with coin logos, live market for all coins, portfolio chart
- **Swap** any holding into **USD** or into **any other coin/network**, at the live
  market rate, with an estimate before confirming
- **Withdraw to bank** — USD only (swap crypto → USD first)
- **Withdraw to crypto** — pick coin/network, paste address, amount
- **Deposit** — shows the admin's demo address for the chosen coin/network, with Copy
- Transactions history (deposits, swaps, withdrawals + status), rejection notices
  with the admin's reason on the dashboard
- My Account: edit name/phone/country, change password
- Support (mail + WhatsApp), KYC "Upgrade Now", Buy Crypto link

## Network fee rule (swaps and crypto withdrawals)

The fee is paid in the network's gas coin, taken from the same wallet. If the wallet
doesn't have enough of it, the action is blocked with "X needed before swapping can work".

| Network | Gas coin | Fee |
|---|---|---|
| ERC20 | ETH | 0.0025 |
| BEP20 | BNB | 0.012 |
| TRC20 | TRX | 6 |
| SOL | SOL | 0.03 |
| MATIC | MATIC | 0.6 |
| BTC (native) | — | 0 |

Edit coins, networks and fees in `utils/constants.js`.

## Money safety

Every swap/withdrawal/reject runs as one all-or-nothing database step, so balances can
never end up half-updated. Withdrawals hold the amount (and fee) immediately; a
rejection returns both.

## Live prices

Prices come from CoinGecko (cached ~45 s). If it's unreachable, the app falls back to
fixed demo prices and labels the market card "Offline / demo prices".

## Project layout

```
server.js            Express app
config/db.js         SQLite setup (better-sqlite3, falls back to Node's built-in node:sqlite)
models/              User, Transaction, DepositAddress, SupportSettings
routes/              auth, admin, user APIs
utils/               coin/network/fee table, live prices, credential generator
public/              the website (HTML/CSS/JS, no build step)
data/                created automatically — your database file
```

## Disclaimer

Demo only. It does not connect to any real exchange, blockchain or bank.
