# Running the diagnostics

`doctor.js` reproduces the startup sequence step by step and tells you which
step fails. It works even when nothing is installed — it will simply report the
missing dependencies.

There are two places to run it. They answer different questions.

| Where | Answers |
|---|---|
| On your own machine (VS Code) | Are my credentials and config correct? |
| On the server | Why will the app not start *there*? |

Start with your own machine: it is faster, and bad credentials are the most
common problem.

---

## On your own machine, with VS Code

**1. Install Node.js** — [nodejs.org](https://nodejs.org), take the LTS build.
Confirm it worked by opening a terminal and running:

```bash
node --version
```

Anything `v18` or higher is fine.

**2. Open the project.** Extract the zip, then in VS Code choose
*File → Open Folder* and select the folder that contains `app.js`. Not its
parent — the folder with `app.js` directly inside it.

**3. Open a terminal in VS Code** — *Terminal → New Terminal*. It opens in the
project folder already.

**4. Install the dependencies:**

```bash
npm install
```


### If PowerShell blocks npm on Windows

You may see:

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running
scripts is disabled on this system.
```

That is a Windows security policy blocking PowerShell scripts. It is not a
problem with this project, and npm itself is fine. Pick whichever is easiest:

**Use `npm.cmd`** — the same npm, as a batch file, which the policy does not
touch. Nothing to change:

```powershell
npm.cmd install
npm.cmd start
```

**Or use Command Prompt instead of PowerShell.** In VS Code the terminal
dropdown (the `v` next to `+`) has a *Command Prompt* option. Plain `npm` works
there.

**Or allow signed scripts for your user only:**

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

This affects only your account, not the machine, and permits local scripts plus
signed remote ones. Answer `Y` when prompted, then `npm install` works normally.

`node doctor.js` and `node app.js` are unaffected either way — `node` is a
program, not a script.

### Avoid spaces in the folder path

A path such as `C:\Users\PC\Downloads\rnsvoice (6)` contains a space and
brackets, which some npm scripts on Windows handle badly. If you see odd
failures, move the folder somewhere plain like `C:\rnsvoice`.

**5. Create your `.env`.** Copy `.env.example` to `.env` and fill in the real
values:

```bash
cp .env.example .env
```

On Windows PowerShell use `copy .env.example .env`. Then open `.env` in VS Code
and replace each `REPLACE_ME` with the real value. Replace the *whole* value —
do not paste next to the placeholder.

**6. Run the diagnostics:**

```bash
node doctor.js
```

Every line marked `FAIL` is a real problem, and each carries the fix.

**7. If it passes, run the app locally:**

```bash
npm start
```

Open <http://localhost:3000>. The dashboard, campaign setup and lead import all
work locally. Phone calls will not, because Plivo cannot reach a laptop — that
needs the deployed URL.

---

## On the server

This only works if your hosting plan gives you SSH or a terminal. Check
**hPanel → Advanced → SSH Access**. Many shared plans do not include it, in
which case use the section below instead.

```bash
cd ~/rnsvoice          # or wherever the app root is
node doctor.js
```

---

## If you have no terminal on the server

Use these three places in hPanel instead. They cover the same ground.

**1. Deployments** — this is where a failed build shows up. If the app never
starts, the reason is almost always here: an `npm install` error, or a build
that did not finish. Runtime logs will be empty in that case, because the
process never ran.

**2. Runtime logs** — output from the app once it is running. "No logs found"
means it never started. Once it does start you will see a line beginning
`RNS voice agent is listening`.

**3. Environment variables** — on this hosting product, set the configuration
here rather than in a `.env` file. Values set here override the file, and they
survive a redeploy that replaces your files.

Set these:

```
XAI_API_KEY          xai-...          (must keep the xai- prefix)
XAI_AGENT_ID         agent_CvgfdQIkeaZ1IGqg
PLIVO_AUTH_ID        ...
PLIVO_AUTH_TOKEN     ...              (no REPLACE_ME left in it)
PLIVO_PHONE_NUMBER   +918031705594
PUBLIC_BASE_URL      https://your-domain.com     (no trailing slash)
DASHBOARD_PASSWORD   ...              (long)
DEFAULT_COUNTRY_CODE 91
DEFAULT_TIMEZONE     Asia/Kolkata
```

Leave `PORT` unset — the platform assigns it, and a hardcoded value stops it
reaching your app.

Redeploy after changing these.
