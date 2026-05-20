import { useState, useEffect, FormEvent } from 'react';
import { Database, Play, CheckCircle2, AlertCircle, Terminal, Settings, Code2, ArrowRight, Copy, Server, Check } from 'lucide-react';

export default function App() {
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tool testing state
  const [selectedTool, setSelectedTool] = useState('get_tenant_info');
  const [tenantId, setTenantId] = useState('tenant-123-uuid');
  const [appId1, setAppId1] = useState('app-finance-2024');
  const [appId2, setAppId2] = useState('app-finance-2025');
  const [limit, setLimit] = useState('50');
  const [nextCursor, setNextCursor] = useState('');
  const [toolResult, setToolResult] = useState<any>(null);
  const [toolExecuting, setToolExecuting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Guide tabs
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'inspector'>('claude');

  useEffect(() => {
    fetch('/api/status')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch server status');
        return res.json();
      })
      .then(data => {
        setServerStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const executeMockTool = async (e: FormEvent) => {
    e.preventDefault();
    setToolExecuting(true);
    setToolResult(null);

    let args = {};
    if (selectedTool === 'get_tenant_info') {
      args = { tenantId };
    } else if (selectedTool === 'list_apps') {
      args = { limit: limit ? parseInt(limit, 10) : undefined, next: nextCursor || undefined };
    } else {
      args = { appId1, appId2 };
    }

    try {
      const res = await fetch('/api/test-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedTool,
          args
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute tool');
      }
      setToolResult(data);
    } catch (err: any) {
      setToolResult({ error: err.message });
    } finally {
      setToolExecuting(false);
    }
  };

  const claudeConfig = JSON.stringify({
    "mcpServers": {
      "qlik-sense-mcp": {
        "command": "node",
        "args": ["C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/dist/server.cjs", "--stdio"],
        "env": {
          "QLIK_TENANT_URL": serverStatus?.configuredEnv?.QLIK_TENANT_URL ? "CONFIGURED" : "https://your-tenant.qlikcloud.com",
          "QLIK_API_KEY": serverStatus?.configuredEnv?.QLIK_API_KEY ? "CONFIGURED" : "your-api-key"
        }
      }
    }
  }, null, 2);

  const cursorConfig = `node "C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/dist/server.cjs" --stdio`;
  const inspectorCommand = `npx @modelcontextprotocol/inspector node dist/server.cjs --stdio`;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-900 font-sans">
      {/* Top Navigation Bar */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">MCP Qlik Sense Utility</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Script Comparison & Reporting Tool</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-green-700">MCP Server: Active</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Server Info and Config */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Status Panel */}
            <div className="bg-white border border-slate-200 p-6 rounded shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Server Status</h2>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200">v1.0.0</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Local MCP Server</div>
                    <div className="text-xs text-slate-500">Transports: Stdio, SSE</div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                  <span className="text-slate-500">HTTP Status Port</span>
                  <span className="font-mono font-semibold text-slate-700">3000</span>
                </div>
              </div>
            </div>

            {/* Credentials Status */}
            <div className="bg-white border border-slate-200 p-6 rounded shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Environment Setup</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">QLIK_TENANT_URL</span>
                  {serverStatus?.configuredEnv?.QLIK_TENANT_URL ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Configured</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Missing (Using Mock)</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">QLIK_API_KEY</span>
                  {serverStatus?.configuredEnv?.QLIK_API_KEY ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Configured</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Missing (Using Mock)</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">GEMINI_API_KEY</span>
                  {serverStatus?.configuredEnv?.GEMINI_API_KEY ? (
                    <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Configured</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertCircle className="w-3.5 h-3.5" /> Missing (Optional)</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-normal">
                To connect to an active Qlik Sense deployment, configure these settings in your local <code className="bg-slate-50 px-1 py-0.5 rounded border border-slate-200">.env</code> file.
              </p>
            </div>

            {/* Tool Declarations */}
            <div className="bg-white border border-slate-200 p-6 rounded shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Exposed Tools</h2>
              <div className="space-y-4">
                <div className="border-l-2 border-blue-500 pl-3">
                  <div className="text-xs font-bold text-slate-700 font-mono">get_tenant_info</div>
                  <p className="text-[11px] text-slate-500 mt-1">Retrieves metadata details for a specific Qlik Sense tenant environment.</p>
                </div>
                <div className="border-l-2 border-blue-500 pl-3">
                  <div className="text-xs font-bold text-slate-700 font-mono">list_apps</div>
                  <p className="text-[11px] text-slate-500 mt-1">Lists all apps inside the Qlik Sense tenant with support for cursor pagination.</p>
                </div>
                <div className="border-l-2 border-blue-500 pl-3">
                  <div className="text-xs font-bold text-slate-700 font-mono">compare_scripts</div>
                  <p className="text-[11px] text-slate-500 mt-1">Compares the Qlik script sections of two separate apps and gives change report summaries.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Columns - Connection Guides and Interactive Tester */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Guide Tabs */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="text-sm font-bold text-slate-700">Connecting to MCP Host Clients</h2>
                <p className="text-xs text-slate-500 mt-1">Use the following configurations to mount this MCP server onto your local tools.</p>
              </div>

              {/* Tabs header */}
              <div className="flex border-b border-slate-100 bg-white px-6">
                <button 
                  onClick={() => setActiveTab('claude')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'claude' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Claude Desktop
                </button>
                <button 
                  onClick={() => setActiveTab('cursor')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'cursor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  Cursor IDE
                </button>
                <button 
                  onClick={() => setActiveTab('inspector')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'inspector' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  MCP Inspector
                </button>
              </div>

              {/* Tabs body */}
              <div className="p-6">
                {activeTab === 'claude' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Add this configuration block to your Claude Desktop configuration file (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">claude_desktop_config.json</code>):
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-200 font-mono text-[11px] p-4 rounded overflow-x-auto leading-relaxed">
                        {claudeConfig}
                      </pre>
                      <button 
                        onClick={() => handleCopy(claudeConfig, 'claude')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"
                        title="Copy Configuration"
                      >
                        {copiedText === 'claude' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'cursor' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      To integrate with Cursor, go to <strong>Settings &gt; Features &gt; MCP</strong>, click <strong>+ Add New MCP Server</strong>, set the type to <strong>stdio</strong>, and copy the command:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-200 font-mono text-[11px] p-4 rounded overflow-x-auto leading-relaxed break-all whitespace-pre-wrap">
                        {cursorConfig}
                      </pre>
                      <button 
                        onClick={() => handleCopy(cursorConfig, 'cursor')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"
                        title="Copy Command"
                      >
                        {copiedText === 'cursor' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'inspector' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Use the official Model Context Protocol Inspector to debug tools and resources in your browser window:
                    </p>
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-200 font-mono text-[11px] p-4 rounded overflow-x-auto leading-relaxed break-all whitespace-pre-wrap">
                        {inspectorCommand}
                      </pre>
                      <button 
                        onClick={() => handleCopy(inspectorCommand, 'inspector')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"
                        title="Copy Command"
                      >
                        {copiedText === 'inspector' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Tool Playground */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-700">Tool execution playground</h2>
                  <p className="text-xs text-slate-500 mt-1">Directly trigger mock tool endpoints to inspect payload shapes.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setSelectedTool('get_tenant_info'); setToolResult(null); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${selectedTool === 'get_tenant_info' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300'}`}
                  >
                    get_tenant_info
                  </button>
                  <button 
                    onClick={() => { setSelectedTool('list_apps'); setToolResult(null); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${selectedTool === 'list_apps' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300'}`}
                  >
                    list_apps
                  </button>
                  <button 
                    onClick={() => { setSelectedTool('compare_scripts'); setToolResult(null); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${selectedTool === 'compare_scripts' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300'}`}
                  >
                    compare_scripts
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={executeMockTool} className="space-y-4">
                  {selectedTool === 'get_tenant_info' ? (
                    <div>
                      <label htmlFor="tenantId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        tenantId (UUID)
                      </label>
                      <input 
                        type="text" 
                        id="tenantId"
                        className="w-full bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-2 px-3 text-xs text-slate-700 font-mono"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        placeholder="e.g. tenant-abc-123"
                        required
                      />
                    </div>
                  ) : selectedTool === 'list_apps' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="limit" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          limit (Max items, default 50)
                        </label>
                        <input 
                          type="number" 
                          id="limit"
                          className="w-full bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-2 px-3 text-xs text-slate-700 font-mono"
                          value={limit}
                          onChange={(e) => setLimit(e.target.value)}
                          placeholder="50"
                        />
                      </div>
                      <div>
                        <label htmlFor="nextCursor" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          next cursor (pagination token)
                        </label>
                        <input 
                          type="text" 
                          id="nextCursor"
                          className="w-full bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-2 px-3 text-xs text-slate-700 font-mono"
                          value={nextCursor}
                          onChange={(e) => setNextCursor(e.target.value)}
                          placeholder="e.g. cursor-token-abc"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="appId1" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Source App ID (appId1)
                        </label>
                        <input 
                          type="text" 
                          id="appId1"
                          className="w-full bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-2 px-3 text-xs text-slate-700 font-mono"
                          value={appId1}
                          onChange={(e) => setAppId1(e.target.value)}
                          placeholder="e.g. Finance_FY24"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="appId2" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Target App ID (appId2)
                        </label>
                        <input 
                          type="text" 
                          id="appId2"
                          className="w-full bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-2 px-3 text-xs text-slate-700 font-mono"
                          value={appId2}
                          onChange={(e) => setAppId2(e.target.value)}
                          placeholder="e.g. Finance_FY25"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={toolExecuting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded text-xs font-bold hover:shadow transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Execute Tool
                  </button>
                </form>

                {toolResult && (
                  <div className="mt-6 border border-slate-200 rounded overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Response Payload
                    </div>
                    <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(toolResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-slate-800 text-slate-400 flex items-center justify-between px-4 text-[10px] shrink-0 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Local MCP Connected
          </span>
          <span>Port: 3000</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-600">ID: QLX-MCP-01</span>
        </div>
      </footer>
    </div>
  );
}
