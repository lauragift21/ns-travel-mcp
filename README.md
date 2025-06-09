# NS Travel MCP Server 

This MCP server provides real-time Dutch Railways (NS) data for journey planning, live departures, disruptions, and station search.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=<https://github.com/lauragift21/ns-travel-mcp>)

## Features

1. **Journey Planning** - Plan optimal routes between stations with real-time updates
2. **Live Departures** - Get real-time departure boards for any station  
3. **Disruption Alerts** - Check service disruptions and maintenance work
4. **Station Search** - Find stations with auto-suggestions

## Prerequisites

1. **NS API Key**: Get your free API key from [NS API Portal](https://apiportal.ns.nl/)
   - Sign up for an account
   - Subscribe to the "NS App" product (free)
   - Copy your subscription key

2. **Cloudflare Account**: Sign up at [Cloudflare](https://cloudflare.com)

3. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Create project directory
git clone git@github.com:lauragift21/ns-travel-mcp.git
cd ns-mcp-server

# Install dependencies
npm install
```

### 2. Set Environment Variables

```bash
# Set your NS API key as a secret
npx wrangler secret put NS_API_KEY
# Paste your NS API subscription key when prompted
```

#### Local Development

Create a `.dev.vars` file in the project root with your NS API key:

```
NS_API_KEY=your_ns_api_key
```
### 4. Deploy

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy

# Your MCP server will be available at:
# https://ns-travel-mcp.your-subdomain.workers.dev
```

## Using with MCP Client (e.g Claude Desktop)

To use this MCP server with Claude Desktop, add it to your configuration:  `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ns-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-deployment.workers.dev/sse"
      ],
      "env": {
        "NS_API_KEY": "<YOUR_API_KEY"
      }
    }
  }
}
```

### Connect to Cloudflare AI Playground

You can connect your MCP server from the Cloudflare AI Playground, which is a remote MCP client:

- Go to https://playground.ai.cloudflare.com/
- Enter your deployed MCP server URL (remote-mcp-server-authless.<your-account>.workers.dev/sse)
- You can now use your MCP tools directly from the playground!


## Common Use Cases

### Basic Journey Planning
```
Plan my journey from Amsterdam Centraal to Utrecht Centraal tomorrow at 8:00 AM
```

### Weekend Travel
```
Plan a trip from Amsterdam Centraal to Rotterdam Centraal this Saturday at 2:00 PM. I want to see both earlier and later options.
```

### Route Impact Assessment
```
Are there any disruptions that would affect travel between Amsterdam and Utrecht?
```

### Planned vs Unplanned Issues
```
Show me both planned maintenance and unexpected disruptions happening today
```

### Find Stations
```
Find all train stations in Amsterdam
```

### Airport Connection
```
I'm flying into Schiphol at 3:00 PM. What's the best way to get to Amsterdam Centraal, and when should I expect to arrive?
```

### Event Planning
```
I have a meeting in Rotterdam at 10:00 AM. What time should I leave from Amsterdam Centraal to arrive on time?
```

### Emergency Alternatives
```
My usual train from Amsterdam to Utrecht is cancelled. What are my alternative options?
```

### Night Travel
```
What are the last trains from Amsterdam Centraal to Utrecht tonight?
```

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your NS API key is correctly set
   ```bash
   wrangler secret put NS_API_KEY
   ```

2. **Station Not Found**: Use exact station names or codes
   - ✅ "Amsterdam Centraal" or "asd"
   - ❌ "Amsterdam Central" or "amsterdam"

3. **CORS Issues**: The server includes CORS headers for browser requests

4. **Rate Limiting**: NS API has rate limits - implement caching if needed

### Debug Mode
```bash
# Run locally for debugging
npx wrangler dev

# Check logs
npx wrangler tail
```

## Resources

- NS API Documentation: [apiportal.ns.nl](https://apiportal.ns.nl)
- Cloudflare Workers: [developers.cloudflare.com](https://developers.cloudflare.com)
- Model Context Protocol [modelcontextprotocol.io/introduction](https://modelcontextprotocol.io/introduction)

## License

MIT License - Feel free to modify and extend for your needs!