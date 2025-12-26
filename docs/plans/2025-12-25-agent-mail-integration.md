# Agent Mail Integration Implementation Plan

> **For Claude:** Use executing-plans or subagent-driven-development skill to implement this plan.

**Goal:** Enable bidirectional communication between Claude Code and delegated OpenCode agents via Agent Mail, allowing agents to pause for clarification and receive guidance during execution.

**Architecture:** Agent Mail server runs as standalone Python service on localhost:8765. Claude Code session and OpenCode delegated agents connect as separate named agents. Helper scripts wrap `bd message` commands for common operations. Delegation script modified to set environment variables and poll for incoming messages.

**Tech Stack:**
- Agent Mail Server (Python/WebSocket)
- Beads CLI (`bd message` commands)
- Bash helper scripts
- Environment variables

**Prerequisites:**
- Beads installed and working (`bd` command available)
- Python 3.8+ with pip
- Git for cloning repositories

---

### Task 1: Agent Mail Server - Clone and Setup

**Context:** The Agent Mail server is a separate Python project that must be cloned and set up before agents can communicate.

**Files to Interact:**
- C: `~/services/agent-mail/` (Create directory)
- C: `~/services/agent-mail/.venv/` (Create virtualenv)

**Step 1: Create services directory and clone repository**

```bash
mkdir -p ~/services
cd ~/services
git clone https://github.com/Dicklesworthstone/mcp_agent_mail agent-mail
```

**Step 2: Create Python virtual environment**

```bash
cd ~/services/agent-mail
python3 -m venv .venv
source .venv/bin/activate
```

**Step 3: Install dependencies**

```bash
pip install -r requirements.txt
```

Expected output: All dependencies install successfully without errors

**Step 4: Verify installation**

Run: `python3 agentmail_server.py --help`
Expected: Help text showing command-line options for the server

**Step 5: Review & Document**

Document installation location and create start script reference.

---

### Task 2: Agent Mail Server - Create Start Script

**Context:** A dedicated start script ensures the Agent Mail server runs consistently with the correct configuration.

**Files to Interact:**
- C: `~/bin/start-agent-mail-server.sh` (Create)

**Step 1: Write the start script**

Create script to start Agent Mail server with correct parameters.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Agent Mail Server Startup Script
# Starts the Agent Mail server for agent-to-agent communication

AGENT_MAIL_DIR="$HOME/services/agent-mail"
VENV_DIR="$AGENT_MAIL_DIR/.venv"
LOG_DIR="$HOME/.agent-mail/logs"
PID_FILE="$HOME/.agent-mail/server.pid"

# Create log directory
mkdir -p "$LOG_DIR"
mkdir -p "$(dirname "$PID_FILE")"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Agent Mail server already running (PID: $PID)" >&2
        echo "Web UI: http://127.0.0.1:8765/mail" >&2
        exit 0
    else
        # Stale PID file
        rm "$PID_FILE"
    fi
fi

# Activate virtualenv and start server
cd "$AGENT_MAIL_DIR"
source "$VENV_DIR/bin/activate"

echo "Starting Agent Mail server..." >&2
python3 agentmail_server.py \
    --host 127.0.0.1 \
    --port 8765 \
    >> "$LOG_DIR/server-$(date +%Y%m%d).log" 2>&1 &

SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo "Agent Mail server started (PID: $SERVER_PID)" >&2
echo "Web UI: http://127.0.0.1:8765/mail" >&2
echo "Logs: $LOG_DIR/server-$(date +%Y%m%d).log" >&2
```

**Step 2: Make executable**

Run: `chmod +x ~/bin/start-agent-mail-server.sh`

**Step 3: Test the script**

Run: `~/bin/start-agent-mail-server.sh`
Expected: Server starts, PID file created, log file written

**Step 4: Verify server is running**

Run: `curl -s http://127.0.0.1:8765/health || echo "Server not responding"`
Expected: Health check response or server status

**Step 5: Review & Commit**

```bash
git add ~/bin/start-agent-mail-server.sh
git commit -m "feat: add Agent Mail server startup script"
```

---

### Task 3: Agent Mail Server - Create Stop Script

**Context:** A matching stop script ensures clean shutdown of the Agent Mail server.

**Files to Interact:**
- C: `~/bin/stop-agent-mail-server.sh` (Create)

**Step 1: Write the stop script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Agent Mail Server Stop Script
# Cleanly stops the Agent Mail server

PID_FILE="$HOME/.agent-mail/server.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Agent Mail server not running (no PID file)" >&2
    exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping Agent Mail server (PID: $PID)..." >&2
    kill "$PID"

    # Wait for shutdown
    sleep 2

    if kill -0 "$PID" 2>/dev/null; then
        echo "Force stopping..." >&2
        kill -9 "$PID"
    fi

    rm "$PID_FILE"
    echo "Agent Mail server stopped" >&2
else
    echo "Agent Mail server not running (stale PID file)" >&2
    rm "$PID_FILE"
fi
```

**Step 2: Make executable**

Run: `chmod +x ~/bin/stop-agent-mail-server.sh`

**Step 3: Test stop script**

Run: `~/bin/stop-agent-mail-server.sh`
Expected: Server stops, PID file removed

**Step 4: Test full cycle**

```bash
~/bin/start-agent-mail-server.sh
sleep 2
~/bin/stop-agent-mail-server.sh
```

Expected: Server starts and stops cleanly

**Step 5: Review & Commit**

```bash
git add ~/bin/stop-agent-mail-server.sh
git commit -m "feat: add Agent Mail server stop script"
```

---

### Task 4: Environment Configuration - Create Agent Mail Config File

**Context:** A centralized configuration file stores Agent Mail environment variables that can be sourced by scripts and shells.

**Files to Interact:**
- C: `~/.agent-mail/config.env` (Create)

**Step 1: Create config directory and file**

```bash
mkdir -p ~/.agent-mail
cat > ~/.agent-mail/config.env << 'EOF'
# Agent Mail Configuration
# Source this file to set environment variables for Agent Mail client

# Agent Mail server URL
export BEADS_AGENT_MAIL_URL="http://127.0.0.1:8765"

# Agent name for Claude Code main session
# Change this in delegation script for OpenCode agents
export BEADS_AGENT_NAME="claude-code-main"

# Optional project identifier
export BEADS_PROJECT_ID="prusatouch"
EOF
```

**Step 2: Test sourcing the config**

Run: `source ~/.agent-mail/config.env && env | grep BEADS_AGENT`
Expected: See BEADS_AGENT_MAIL_URL, BEADS_AGENT_NAME, BEADS_PROJECT_ID set

**Step 3: Add to shell rc file (optional)**

Add to `~/.zshrc` or `~/.bashrc` for automatic loading:
```bash
# Agent Mail configuration
[ -f ~/.agent-mail/config.env ] && source ~/.agent-mail/config.env
```

**Step 4: Verify environment persistence**

Start new shell, check: `echo $BEADS_AGENT_MAIL_URL`
Expected: Shows the Agent Mail server URL

**Step 5: Document & Commit**

```bash
git add ~/.agent-mail/config.env
git commit -m "feat: add Agent Mail environment configuration"
```

---

### Task 5: Helper Scripts - Message Sending Wrapper

**Context:** A helper script simplifies sending messages to other agents with error handling and logging.

**Files to Interact:**
- C: `~/bin/agent-mail-send.sh` (Create)

**Step 1: Write the send wrapper**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Agent Mail Send Wrapper
# Usage: agent-mail-send.sh <recipient> <message> [thread_id]

if [ $# -lt 2 ]; then
    echo "Usage: $0 <recipient> <message> [thread_id]" >&2
    echo "" >&2
    echo "Example:" >&2
    echo "  $0 opencode-delegator 'Please clarify requirement X'" >&2
    echo "  $0 claude-code-main 'Completed bd-a3f8' bd-a3f8" >&2
    exit 1
fi

RECIPIENT="$1"
MESSAGE="$2"
THREAD_ID="${3:-}"

# Source Agent Mail config if available
[ -f ~/.agent-mail/config.env ] && source ~/.agent-mail/config.env

# Check environment
if [ -z "${BEADS_AGENT_MAIL_URL:-}" ]; then
    echo "Error: BEADS_AGENT_MAIL_URL not set" >&2
    echo "Run: source ~/.agent-mail/config.env" >&2
    exit 1
fi

if [ -z "${BEADS_AGENT_NAME:-}" ]; then
    echo "Error: BEADS_AGENT_NAME not set" >&2
    exit 1
fi

# Send message
echo "Sending message to $RECIPIENT..." >&2

if [ -n "$THREAD_ID" ]; then
    bd message send "$RECIPIENT" "$MESSAGE" --thread "$THREAD_ID" --json
else
    bd message send "$RECIPIENT" "$MESSAGE" --json
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✓ Message sent to $RECIPIENT" >&2
else
    echo "✗ Failed to send message (exit code: $EXIT_CODE)" >&2
fi

exit $EXIT_CODE
```

**Step 2: Make executable**

Run: `chmod +x ~/bin/agent-mail-send.sh`

**Step 3: Test send script (requires Agent Mail server running)**

```bash
~/bin/start-agent-mail-server.sh
sleep 2
~/bin/agent-mail-send.sh test-recipient "Hello from test"
```

Expected: Message sent successfully (even if recipient doesn't exist yet)

**Step 4: Verify message sent**

Run: `bd message inbox --json | jq .`
Expected: See sent messages in outbox or delivery status

**Step 5: Review & Commit**

```bash
git add ~/bin/agent-mail-send.sh
git commit -m "feat: add Agent Mail send wrapper script"
```

---

### Task 6: Helper Scripts - Message Inbox Checker

**Context:** A helper script checks for unread messages and displays them in a readable format.

**Files to Interact:**
- C: `~/bin/agent-mail-check.sh` (Create)

**Step 1: Write the inbox checker**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Agent Mail Inbox Checker
# Usage: agent-mail-check.sh [--all]

SHOW_ALL=false

if [ "${1:-}" = "--all" ]; then
    SHOW_ALL=true
fi

# Source Agent Mail config if available
[ -f ~/.agent-mail/config.env ] && source ~/.agent-mail/config.env

# Check environment
if [ -z "${BEADS_AGENT_MAIL_URL:-}" ] || [ -z "${BEADS_AGENT_NAME:-}" ]; then
    echo "Error: Agent Mail not configured" >&2
    echo "Run: source ~/.agent-mail/config.env" >&2
    exit 1
fi

# Get messages
if $SHOW_ALL; then
    MESSAGES=$(bd message inbox --json 2>/dev/null)
else
    MESSAGES=$(bd message inbox --unread-only --json 2>/dev/null)
fi

# Check if we have messages
MSG_COUNT=$(echo "$MESSAGES" | jq 'length' 2>/dev/null || echo "0")

if [ "$MSG_COUNT" -eq 0 ]; then
    echo "No $([ "$SHOW_ALL" = false ] && echo "unread ")messages" >&2
    exit 0
fi

echo "📬 You have $MSG_COUNT $([ "$SHOW_ALL" = false ] && echo "unread ")message(s):" >&2
echo "" >&2

# Display messages in readable format
echo "$MESSAGES" | jq -r '.[] | "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Message ID: \(.id)
From: \(.from)
Thread: \(.thread_id // "none")
Sent: \(.timestamp)

\(.body)
"'

# Return count as exit code (0 if no messages, count if messages exist)
[ "$MSG_COUNT" -gt 0 ] && exit "$MSG_COUNT" || exit 0
```

**Step 2: Make executable**

Run: `chmod +x ~/bin/agent-mail-check.sh`

**Step 3: Test inbox checker**

Run: `~/bin/agent-mail-check.sh`
Expected: Shows unread messages or "No unread messages"

**Step 4: Test with --all flag**

Run: `~/bin/agent-mail-check.sh --all`
Expected: Shows all messages including read ones

**Step 5: Review & Commit**

```bash
git add ~/bin/agent-mail-check.sh
git commit -m "feat: add Agent Mail inbox checker script"
```

---

### Task 7: Helper Scripts - Message Read and Acknowledge

**Context:** A helper script reads a specific message and optionally acknowledges it.

**Files to Interact:**
- C: `~/bin/agent-mail-read.sh` (Create)

**Step 1: Write the read/ack script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Agent Mail Read and Acknowledge
# Usage: agent-mail-read.sh <message_id> [--ack]

if [ $# -lt 1 ]; then
    echo "Usage: $0 <message_id> [--ack]" >&2
    echo "" >&2
    echo "Example:" >&2
    echo "  $0 msg-abc123           # Read only" >&2
    echo "  $0 msg-abc123 --ack     # Read and acknowledge" >&2
    exit 1
fi

MESSAGE_ID="$1"
ACK=false

if [ "${2:-}" = "--ack" ]; then
    ACK=true
fi

# Source Agent Mail config if available
[ -f ~/.agent-mail/config.env ] && source ~/.agent-mail/config.env

# Check environment
if [ -z "${BEADS_AGENT_MAIL_URL:-}" ] || [ -z "${BEADS_AGENT_NAME:-}" ]; then
    echo "Error: Agent Mail not configured" >&2
    exit 1
fi

# Read message
MESSAGE=$(bd message read "$MESSAGE_ID" --json 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$MESSAGE" ]; then
    echo "Error: Could not read message $MESSAGE_ID" >&2
    exit 1
fi

# Display message
echo "$MESSAGE" | jq -r '"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Message ID: \(.id)
From: \(.from)
To: \(.to)
Thread: \(.thread_id // "none")
Sent: \(.timestamp)

\(.body)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'

# Acknowledge if requested
if $ACK; then
    echo "" >&2
    echo "Acknowledging message..." >&2
    bd message ack "$MESSAGE_ID"

    if [ $? -eq 0 ]; then
        echo "✓ Message acknowledged" >&2
    else
        echo "✗ Failed to acknowledge message" >&2
        exit 1
    fi
fi
```

**Step 2: Make executable**

Run: `chmod +x ~/bin/agent-mail-read.sh`

**Step 3: Test read script**

First send a test message, then read it:
```bash
~/bin/agent-mail-send.sh claude-code-main "Test message"
MSG_ID=$(bd message inbox --json | jq -r '.[0].id')
~/bin/agent-mail-read.sh "$MSG_ID"
```

Expected: Message displayed in readable format

**Step 4: Test with acknowledgment**

Run: `~/bin/agent-mail-read.sh "$MSG_ID" --ack`
Expected: Message displayed and acknowledged

**Step 5: Review & Commit**

```bash
git add ~/bin/agent-mail-read.sh
git commit -m "feat: add Agent Mail read and acknowledge script"
```

---

### Task 8: Delegation Script - Add Agent Mail Environment Setup

**Context:** The delegation script must configure OpenCode agents with appropriate Agent Mail environment variables.

**Files to Interact:**
- M: `~/bin/opencode_delegate.sh:12-33` (Modify)

**Step 1: Add Agent Mail environment setup**

After the existing environment setup (around line 33), add:

```bash
# Agent Mail configuration for delegated OpenCode agent
export BEADS_AGENT_MAIL_URL="${BEADS_AGENT_MAIL_URL:-http://127.0.0.1:8765}"
export BEADS_AGENT_NAME="opencode-${RUN_ID}"  # Unique name per delegation
export BEADS_PROJECT_ID="${BEADS_PROJECT_ID:-$(basename "$PROJECT_DIR")}"

echo "Agent Mail: $BEADS_AGENT_NAME @ $BEADS_AGENT_MAIL_URL" >&2
```

**Step 2: Verify environment variables are set**

Run delegation script and check it displays Agent Mail config:
```bash
~/bin/opencode_delegate.sh "test task" /tmp/test 2>&1 | grep "Agent Mail:"
```

Expected: Shows "Agent Mail: opencode-YYYYMMDD-HHMMSS-PID @ http://127.0.0.1:8765"

**Step 3: Test that OpenCode receives environment**

Check that `bd message` works from within OpenCode delegation:
```bash
# This would be tested when OpenCode actually runs
# For now, verify environment is exported
```

**Step 4: Document change**

Add comment explaining Agent Mail integration

**Step 5: Review & Commit**

```bash
git add ~/bin/opencode_delegate.sh
git commit -m "feat: add Agent Mail environment to delegation script"
```

---

### Task 9: Delegation Script - Add Message Polling Monitor

**Context:** Add a background process to poll for incoming messages from OpenCode agents and display them.

**Files to Interact:**
- M: `~/bin/opencode_delegate.sh:107-120` (Modify - after token monitor section)

**Step 1: Add message polling monitor**

After the activity monitor section, add:

```bash
  # Agent Mail message polling in background
  (
    sleep 10  # Give OpenCode time to start and send first message

    LAST_MSG_CHECK=0

    while kill -0 $OPENCODE_PID 2>/dev/null; do
      # Check for messages from this specific OpenCode agent
      OPENCODE_AGENT_NAME="opencode-${RUN_ID}"

      # Get unread messages
      MESSAGES=$(bd message inbox --unread-only --json 2>/dev/null | \
                 jq -r --arg from "$OPENCODE_AGENT_NAME" \
                 '.[] | select(.from == $from) | "📨 \(.from): \(.body)"' 2>/dev/null)

      if [ -n "$MESSAGES" ]; then
        echo "" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "Incoming Messages:" >&2
        echo "$MESSAGES" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "" >&2

        # Auto-acknowledge messages (for now)
        # Future: pause and wait for user response
      fi

      sleep 10  # Check every 10 seconds
    done
  ) &

  MESSAGE_MONITOR_PID=$!
```

**Step 2: Update cleanup section**

Add cleanup for message monitor:

```bash
  # Stop message monitoring
  kill $MESSAGE_MONITOR_PID 2>/dev/null || true
  wait $MESSAGE_MONITOR_PID 2>/dev/null || true
```

**Step 3: Test message polling**

Run delegation with Agent Mail server running:
```bash
~/bin/start-agent-mail-server.sh
~/bin/opencode_delegate.sh "Send a test message using bd message send" /tmp/test
```

Expected: Messages from OpenCode appear in delegation output

**Step 4: Verify cleanup**

Check that message monitor stops when delegation completes

**Step 5: Review & Commit**

```bash
git add ~/bin/opencode_delegate.sh
git commit -m "feat: add message polling to delegation script"
```

---

### Task 10: OpenCode Delegator Prompt - Add Agent Mail Instructions

**Context:** The OpenCode delegator prompt must include instructions for using Agent Mail to communicate with Claude Code.

**Files to Interact:**
- M: `~/.claude/workspace/opencode-delegator-prompt.md:60-100` (Modify)

**Step 1: Add Agent Mail section**

After the context monitoring section, add:

```markdown
### Communication via Agent Mail

You can communicate with Claude Code using Agent Mail:

**Send messages:**
```bash
bd message send claude-code-main "Your message here"
bd message send claude-code-main "Question about requirement X" --thread bd-abc123
```

**Check for replies:**
```bash
bd message inbox --unread-only --json
```

**When to use Agent Mail:**
- **Ask for clarification** - Requirements unclear? Send a message and wait for reply
- **Report progress** - Major milestones completed
- **Request decisions** - Multiple valid approaches, need guidance
- **Report blockers** - Can't proceed without information

**Example workflow:**
```bash
# You discover an ambiguity
bd message send claude-code-main "Found ambiguity in requirement for bd-a3f8: Should validation be case-sensitive?"

# Check for reply (poll every 30-60 seconds if waiting)
bd message inbox --unread-only --json | jq -r '.[] | select(.from == "claude-code-main") | .body'

# Continue once you receive guidance
```

**Important:**
- Don't spam - wait reasonable time for replies (30-60 seconds)
- Include BD issue IDs in thread for traceability
- Keep messages concise and specific
```

**Step 2: Verify prompt file syntax**

Run: `cat ~/.claude/workspace/opencode-delegator-prompt.md | grep -A 10 "Communication via Agent Mail"`
Expected: Shows the new section

**Step 3: Test that OpenCode can access instructions**

The prompt is loaded via `{file:...}` in opencode.json, verify it works

**Step 4: Document integration point**

Note where this fits in the overall delegator workflow

**Step 5: Review & Commit**

```bash
git add ~/.claude/workspace/opencode-delegator-prompt.md
git commit -m "feat: add Agent Mail communication to delegator prompt"
```

---

### Task 11: Documentation - Create Agent Mail Quick Start Guide

**Context:** A quick start guide helps users set up and test Agent Mail for the first time.

**Files to Interact:**
- C: `~/prusatouch/docs/agent-mail-quickstart.md` (Create)

**Step 1: Write quick start guide**

```markdown
# Agent Mail Quick Start Guide

Agent Mail enables bidirectional communication between Claude Code and delegated OpenCode agents.

## Initial Setup

### 1. Install Agent Mail Server

```bash
# Clone and install
mkdir -p ~/services
cd ~/services
git clone https://github.com/Dicklesworthstone/mcp_agent_mail agent-mail
cd agent-mail
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the Server

```bash
~/bin/start-agent-mail-server.sh
```

Expected output:
```
Agent Mail server started (PID: 12345)
Web UI: http://127.0.0.1:8765/mail
Logs: ~/.agent-mail/logs/server-20251225.log
```

### 3. Configure Environment

```bash
# Load Agent Mail configuration
source ~/.agent-mail/config.env

# Verify
echo $BEADS_AGENT_MAIL_URL
# Should show: http://127.0.0.1:8765
```

## Testing the Setup

### Test 1: Send a Message

```bash
~/bin/agent-mail-send.sh test-recipient "Hello from Agent Mail"
```

Expected: "✓ Message sent to test-recipient"

### Test 2: Check Inbox

```bash
~/bin/agent-mail-check.sh
```

Expected: Shows any unread messages (or "No unread messages")

### Test 3: Web UI

Open browser: http://127.0.0.1:8765/mail

Expected: See Agent Mail web interface with your messages

## Using with OpenCode Delegation

### Delegate with Agent Mail

```bash
# Start Agent Mail server if not running
~/bin/start-agent-mail-server.sh

# Run delegation (Agent Mail configured automatically)
~/bin/opencode_delegate.sh "Task description" "$PWD"

# Watch for messages from OpenCode agent in the delegation output
```

### Send Message to OpenCode Agent

```bash
# Get the agent name from delegation output
# Format: opencode-YYYYMMDD-HHMMSS-PID

~/bin/agent-mail-send.sh opencode-20251225-152817-142370 "Here's the clarification you requested"
```

## Common Operations

### Check for Messages
```bash
~/bin/agent-mail-check.sh           # Unread only
~/bin/agent-mail-check.sh --all     # All messages
```

### Read Specific Message
```bash
~/bin/agent-mail-read.sh msg-abc123
~/bin/agent-mail-read.sh msg-abc123 --ack  # Read and acknowledge
```

### Send with Thread
```bash
~/bin/agent-mail-send.sh recipient "Message" bd-a3f8
```

## Troubleshooting

### Server won't start
- Check logs: `tail -f ~/.agent-mail/logs/server-*.log`
- Check port: `lsof -i :8765` (should be free)
- Kill existing: `~/bin/stop-agent-mail-server.sh`

### Messages not sending
- Verify environment: `env | grep BEADS_AGENT`
- Check server running: `curl http://127.0.0.1:8765/health`
- Source config: `source ~/.agent-mail/config.env`

### Can't receive messages
- Check inbox: `bd message inbox --json | jq .`
- Verify agent name: `echo $BEADS_AGENT_NAME`
- Check server logs for errors

## Architecture

```
Claude Code Session
    │
    ├─ BEADS_AGENT_NAME=claude-code-main
    ├─ Sends: bd message send opencode-XXXXX "message"
    ├─ Polls: ~/bin/agent-mail-check.sh
    │
    └─> Agent Mail Server (localhost:8765)
            │
            └─> OpenCode Agent
                  │
                  ├─ BEADS_AGENT_NAME=opencode-XXXXX
                  ├─ Sends: bd message send claude-code-main "question"
                  └─ Polls: bd message inbox --unread-only
```

## Next Steps

- Set up automatic server start (systemd/launchd)
- Configure desktop notifications for messages
- Integrate with other agents (subagents, etc.)
- Explore file reservations and threading
```

**Step 2: Verify markdown syntax**

Run: `markdown-lint docs/agent-mail-quickstart.md || echo "No linter available, manual review OK"`

**Step 3: Test that guide is accurate**

Follow the guide yourself to verify all commands work

**Step 4: Add to project documentation index**

Link from main README or docs/README.md

**Step 5: Review & Commit**

```bash
git add docs/agent-mail-quickstart.md
git commit -m "docs: add Agent Mail quick start guide"
```

---

### Task 12: Integration Testing - Full Workflow Test

**Context:** End-to-end test verifies all components work together correctly.

**Files to Interact:**
- C: `~/prusatouch/scripts/test-agent-mail-integration.sh` (Create)

**Step 1: Write integration test script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Agent Mail Integration Test
# Tests complete workflow from server startup to message exchange

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Agent Mail Integration Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Server Start
echo "Test 1: Starting Agent Mail server..."
~/bin/start-agent-mail-server.sh
sleep 3

# Verify server is running
if curl -s http://127.0.0.1:8765/health > /dev/null; then
    echo "✓ Server started and responding"
else
    echo "✗ Server not responding"
    exit 1
fi

echo ""

# Test 2: Environment Configuration
echo "Test 2: Checking environment configuration..."
source ~/.agent-mail/config.env

if [ -n "${BEADS_AGENT_MAIL_URL:-}" ] && [ -n "${BEADS_AGENT_NAME:-}" ]; then
    echo "✓ Environment configured"
    echo "  BEADS_AGENT_MAIL_URL=$BEADS_AGENT_MAIL_URL"
    echo "  BEADS_AGENT_NAME=$BEADS_AGENT_NAME"
else
    echo "✗ Environment not configured"
    exit 1
fi

echo ""

# Test 3: Send Message
echo "Test 3: Sending test message..."
if ~/bin/agent-mail-send.sh test-agent "Integration test message" > /dev/null 2>&1; then
    echo "✓ Message sent successfully"
else
    echo "✗ Failed to send message"
    exit 1
fi

echo ""

# Test 4: Check Inbox
echo "Test 4: Checking inbox..."
INBOX_OUTPUT=$(~/bin/agent-mail-check.sh 2>&1 || true)
echo "✓ Inbox checked (may be empty)"

echo ""

# Test 5: OpenCode Delegation (simulation)
echo "Test 5: Testing delegation environment setup..."
TEST_OUTPUT=$(~/bin/opencode_delegate.sh "echo 'Agent Mail test'; bd message send claude-code-main 'Test from OpenCode'" /tmp/agent-mail-test 2>&1)

if echo "$TEST_OUTPUT" | grep -q "Agent Mail:"; then
    echo "✓ Delegation script sets Agent Mail environment"
else
    echo "✗ Delegation script missing Agent Mail setup"
    exit 1
fi

echo ""

# Test 6: Cleanup
echo "Test 6: Stopping server..."
~/bin/stop-agent-mail-server.sh
echo "✓ Server stopped"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ All tests passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

**Step 2: Make executable**

Run: `chmod +x scripts/test-agent-mail-integration.sh`

**Step 3: Run integration tests**

Run: `./scripts/test-agent-mail-integration.sh`
Expected: All 6 tests pass with ✓ marks

**Step 4: Verify test cleanup**

Check that server is stopped and no processes left:
```bash
lsof -i :8765  # Should be empty
cat ~/.agent-mail/server.pid  # Should not exist or error
```

**Step 5: Review & Commit**

```bash
git add scripts/test-agent-mail-integration.sh
git commit -m "test: add Agent Mail integration test suite"
```

---

## Verification

After all tasks complete:

1. **Run integration test suite:**
   ```bash
   ./scripts/test-agent-mail-integration.sh
   ```
   Expected: All tests pass

2. **Test manual workflow:**
   ```bash
   # Start server
   ~/bin/start-agent-mail-server.sh

   # Send message
   ~/bin/agent-mail-send.sh test-recipient "Test message"

   # Check inbox
   ~/bin/agent-mail-check.sh

   # Stop server
   ~/bin/stop-agent-mail-server.sh
   ```
   Expected: All commands work without errors

3. **Test with actual delegation:**
   ```bash
   ~/bin/start-agent-mail-server.sh
   ~/bin/opencode_delegate.sh "Send me a message via Agent Mail asking for clarification on something" /tmp/test
   ```
   Expected: See message from OpenCode agent in delegation output

4. **Verify documentation:**
   - Quick start guide is accurate
   - All commands in docs work
   - Example workflows complete successfully

---

## Next Steps (Future Enhancements)

- Interactive message response workflow (pause delegation for user input)
- Desktop notifications for incoming messages
- Systemd/launchd service for automatic server startup
- Message history viewer
- File attachment support
- Integration with Claude Code subagents (Task tool)
