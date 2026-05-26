import React, { useState, useEffect, useRef } from 'react';
import catIcon from './assets/catIcon.svg';
import {
  Terminal,
  Send,
  Plus,
  Compass,
  Bot,
  Server,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

const Github = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

// 已在 vite.config.js (本地开发) 和 vercel.json (生产环境) 配置了 API 代理，无需在代码中写死 IP 地址
const API_BASE = '';
// const API_BASE = 'http://175.178.18.199:8000';


// Order of agent nodes as described in the API spec
const NODE_STEPS = [
  "抽取关键字",
  "召回字段",
  "召回指标",
  "召回值",
  "合并召回信息",
  "过滤指标",
  "过滤表格",
  "添加额外上下文信息",
  "生成SQL",
  "验证SQL",
  "校正SQL",
  "执行SQL"
];

export default function App() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState(null); // null means showing all
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Chatbot State
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      text: '你好！我是澳洲房源智能分析 Agent。你可以向我用自然语言查询你想要的房源，例如：“帮我找一下价格在 500 到 600 的房子”',
      status: 'idle'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  // Token Modal State
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenData, setTokenData] = useState([]);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Console State
  const [logs, setLogs] = useState([
    { timestamp: new Date().toLocaleTimeString(), type: 'INFO', step: 'System', info: 'Initializing RentAgent Connection...' }
  ]);

  const [isMobileConsoleOpen, setIsMobileConsoleOpen] = useState(false);

  const logsEndRef = useRef(null);
  const mobileLogsEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      const container = logsEndRef.current.parentNode;
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
    if (mobileLogsEndRef.current) {
      const container = mobileLogsEndRef.current.parentNode;
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
  }, [logs]);

  // Auto scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      const container = chatEndRef.current.parentNode;
      if (container) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 0);
      }
    }
  }, [messages]);

  // Fetch all products on load
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    addLog('INFO', 'API', 'Fetching all rental properties from ' + API_BASE + '/api/products...');
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      const result = await response.json();
      if (result.status === 'success') {
        setProperties(result.data);
        setIsConnecting(false);
        addLog('INFO', 'API', `Successfully fetched ${result.data.length} rental properties.`);
      } else {
        throw new Error('Backend returned failure status');
      }
    } catch (error) {
      console.error(error);
      addLog('ERROR', 'API', `Failed to connect to backend api: ${error.message}`);
      setIsConnecting(false);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addLog = (type, step, info) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp: time, type, step, info }]);
  };

  // Add random product
  const handleInsertRandom = async () => {
    if (isInserting) return;
    setIsInserting(true);
    addLog('INFO', 'API', 'Sending insert request to ' + API_BASE + '/api/product/random...');
    try {
      const response = await fetch(`${API_BASE}/api/product/random`, { method: 'POST' });
      const result = await response.json();
      if (result.status === 'success') {
        const newProduct = result.data;
        setProperties(prev => [...prev, newProduct]);
        addLog('INFO', 'API', `Successfully inserted property: ${newProduct.product_id} - ${newProduct.product_name}`);
      } else {
        throw new Error('Failed to insert');
      }
    } catch (error) {
      addLog('ERROR', 'API', `Insert random failed: ${error.message}`);
    } finally {
      setIsInserting(false);
    }
  };

  const handleCheckTokens = async () => {
    setIsTokenModalOpen(true);
    setIsTokenLoading(true);
    setTokenError('');
    try {
      let ip = '127.0.0.1';
      if (!window.location.hostname.includes('localhost') && window.location.hostname !== '127.0.0.1') {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      }

      const tokenRes = await fetch(`${API_BASE}/api/token-consumption?ip=${ip}`);
      const data = await tokenRes.json();

      if (Array.isArray(data)) {
        setTokenData([...data].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''))));
      } else if (data && data.data && Array.isArray(data.data)) {
        setTokenData([...data.data].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''))));
      } else {
        setTokenData(data);
      }
    } catch (err) {
      setTokenError(err.message);
    } finally {
      setIsTokenLoading(false);
    }
  };

  // Run natural language query
  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isQuerying) return;

    const queryText = inputMessage;
    setInputMessage('');
    setIsQuerying(true);

    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    // Add user message & pending AI message
    setMessages(prev => [
      ...prev,
      { id: userMsgId, type: 'user', text: queryText },
      {
        id: aiMsgId,
        type: 'ai',
        status: 'running',
        currentStep: '抽取关键字',
        nodes: NODE_STEPS.reduce((acc, step) => ({ ...acc, [step]: 'pending' }), {})
      }
    ]);

    addLog('INFO', 'Agent', `Query submitted: "${queryText}"`);

    try {
      const response = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });

      if (!response.body) {
        throw new Error('ReadableStream not supported by backend response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Hold onto last unfinished block

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const jsonStr = cleanLine.slice(6).trim();
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'progress') {
                const { step, status, info } = event;
                addLog('INFO', step, `${status.toUpperCase()} - ${info || ''}`);

                setMessages(prev => prev.map(msg => {
                  if (msg.id === aiMsgId) {
                    const updatedNodes = { ...msg.nodes };

                    // Set all prior steps to success if this step succeeded
                    const currentIdx = NODE_STEPS.indexOf(step);
                    if (currentIdx !== -1) {
                      NODE_STEPS.forEach((s, idx) => {
                        if (idx < currentIdx && updatedNodes[s] === 'pending') {
                          updatedNodes[s] = 'success';
                        }
                      });
                      updatedNodes[step] = status; // success | running | error
                    }

                    return {
                      ...msg,
                      currentStep: step,
                      nodes: updatedNodes
                    };
                  }
                  return msg;
                }));
              }

              else if (event.type === 'result') {
                const resultData = event.data;

                // Identify aggregate metrics
                const firstRow = resultData[0] || {};
                const hasAvgRent = firstRow.hasOwnProperty('AvgRent') || firstRow.hasOwnProperty('avg_rent');
                const hasAvgLease = firstRow.hasOwnProperty('AvgLeaseTerm') || firstRow.hasOwnProperty('avg_lease_term');
                const hasTotalRent = firstRow.hasOwnProperty('TotalRent') || firstRow.hasOwnProperty('total_rent');
                const hasProductId = firstRow.hasOwnProperty('product_id');

                const isMetricsResult = resultData.length > 0 && (hasAvgRent || hasAvgLease || hasTotalRent || !hasProductId);

                const avgRentVal = firstRow.AvgRent !== undefined ? firstRow.AvgRent : firstRow.avg_rent;
                const avgLeaseVal = firstRow.AvgLeaseTerm !== undefined ? firstRow.AvgLeaseTerm : firstRow.avg_lease_term;
                const totalRentVal = firstRow.TotalRent !== undefined ? firstRow.TotalRent : firstRow.total_rent;

                const metricsObj = {
                  avgRent: avgRentVal,
                  avgLeaseTerm: avgLeaseVal,
                  totalRent: totalRentVal
                };

                addLog('INFO', 'Agent', isMetricsResult
                  ? `Execution complete. Extracted analytical indicators.`
                  : `Execution complete. Found ${resultData.length} properties.`);

                setMessages(prev => prev.map(msg => {
                  if (msg.id === aiMsgId) {
                    // Mark all nodes as success
                    const finishedNodes = { ...msg.nodes };
                    NODE_STEPS.forEach(s => {
                      if (finishedNodes[s] === 'pending' || finishedNodes[s] === 'running') {
                        finishedNodes[s] = 'success';
                      }
                    });

                    return {
                      ...msg,
                      status: 'success',
                      text: isMetricsResult
                        ? `我为你计算并汇总了以下分析指标数据：`
                        : `我为你找到了 ${resultData.length} 处匹配的房源信息：`,
                      nodes: finishedNodes,
                      resultCount: resultData.length,
                      resultData: resultData,
                      isMetricsResult: isMetricsResult,
                      metrics: metricsObj
                    };
                  }
                  return msg;
                }));

                // Apply filter to the main table only if they are house listings
                if (!isMetricsResult) {
                  setFilteredProperties(resultData);
                }
              }

              else if (event.type === 'error') {
                const errorMsg = event.message;
                addLog('ERROR', 'Agent', errorMsg);

                setMessages(prev => prev.map(msg => {
                  if (msg.id === aiMsgId) {
                    const errorNodes = { ...msg.nodes };
                    if (msg.currentStep) {
                      errorNodes[msg.currentStep] = 'error';
                    }
                    return {
                      ...msg,
                      status: 'error',
                      text: `抱歉，执行过程中发生了错误：${errorMsg}`,
                      nodes: errorNodes
                    };
                  }
                  return msg;
                }));
              }
            } catch (err) {
              console.error('Failed to parse SSE JSON:', jsonStr, err);
            }
          }
        }
      }
    } catch (error) {
      addLog('ERROR', 'Agent', `SSE stream failed: ${error.message}`);
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMsgId) {
          return {
            ...msg,
            status: 'error',
            text: `网络连接异常，无法连接到 AI Agent。`
          };
        }
        return msg;
      }));
    } finally {
      setIsQuerying(false);
    }
  };

  // Filter properties based on local search input
  const localFilteredProperties = (filteredProperties !== null ? filteredProperties : properties).filter(p => {
    if (!p) return false;
    const s = searchTerm.toLowerCase();
    const id = p.product_id?.toLowerCase() || '';
    const name = p.product_name?.toLowerCase() || '';
    const type = p.property_type?.toLowerCase() || '';
    const region = p.region_name?.toLowerCase() || '';
    return (
      id.includes(s) ||
      name.includes(s) ||
      type.includes(s) ||
      region.includes(s)
    );
  });

  return (
    <div className="h-screen bg-slate-950 bg-gradient-to-br from-[#090D26] to-[#050714] text-white flex flex-col relative overflow-hidden select-none">

      {/* Background Radial Glow Spots */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* 1. Global Header Bar */}
      <header className="h-16 shrink-0 border-b border-blue-950/40 bg-slate-950/70 backdrop-blur-md px-6 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Compass className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            RentAgent.AI
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCheckTokens}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-800 hover:border-slate-700 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">查询tokens使用情况</span>
          </button>
          <a
            href="https://github.com/jerryq1/rent-agent-fronted"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-800 hover:border-slate-700 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </a>
          <a
            href="https://jerryq1.github.io/press/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-800 hover:border-slate-700 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <img src={catIcon} className="w-4 h-4 object-contain" alt="cat icon" />
            <span className="hidden sm:inline">Mr.j blog</span>
          </a>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 min-h-0 flex flex-col md:flex-row p-4 md:p-6 pb-3 gap-4 md:gap-6 relative z-30 overflow-y-auto md:overflow-hidden">

        {/* Left Column: Properties Table (55%) */}
        <section className="flex-1 md:flex-[55] flex flex-col h-[520px] md:h-auto min-h-0 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-blue-500/10 shadow-xl relative overflow-hidden">

          {/* Header of Table */}
          <div className="p-5 border-b border-blue-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Australian Rental Properties</span>
                {filteredProperties !== null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    Query Filter Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Conforms to the local API specifications.</p>
            </div>

            <div className="flex items-center gap-2">
              {filteredProperties !== null && (
                <button
                  onClick={() => setFilteredProperties(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-white transition-all cursor-pointer"
                  title="Reset Filter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}

              <button
                onClick={handleInsertRandom}
                disabled={isInserting}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-all shadow-md ${isInserting
                  ? 'bg-blue-900/30 text-blue-500/50 border border-blue-900/20 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white border border-blue-500/20 hover:shadow-blue-500/20 hover:scale-[1.01]'
                  }`}
              >
                {isInserting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Insert Random Property</span>
              </button>
            </div>
          </div>

          {/* Search bar inside Table Container */}
          <div className="px-5 py-3 border-b border-blue-950/20 bg-slate-950/20 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, Address, Type or Region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 text-slate-200 text-sm focus:ring-0 focus:outline-hidden w-full placeholder-slate-600"
            />
          </div>

          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            <div className="w-full border-collapse">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-3 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-blue-950/40 bg-slate-950/40 rounded-lg mb-2">
                <div className="col-span-2 md:col-span-1">ID</div>
                <div className="col-span-7 sm:col-span-4 md:col-span-3">Address</div>
                <div className="hidden md:block md:col-span-2">Type</div>
                <div className="hidden sm:block sm:col-span-3 md:col-span-2">Beds/Baths</div>
                <div className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-1">Price</div>
                <div className="hidden lg:block lg:col-span-2">Pet Policy</div>
                <div className="hidden xl:block xl:col-span-1">Region</div>
              </div>

              {/* Table Content */}
              {isLoadingProducts && properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                  <span className="text-sm">Loading rental listings...</span>
                </div>
              ) : localFilteredProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                  <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
                  <span className="text-sm">No rental properties found.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {localFilteredProperties.map((p) => (
                    <div
                      key={p.product_id}
                      className="grid grid-cols-12 items-center px-3 py-3 bg-slate-900/60 border border-blue-950/20 rounded-xl hover:border-blue-500/20 hover:scale-[1.005] transition-all hover:shadow-lg hover:shadow-blue-950/10 cursor-pointer"
                    >
                      <div className="col-span-2 md:col-span-1 text-xs font-semibold text-blue-400">{p.product_id}</div>
                      <div className="col-span-7 sm:col-span-4 md:col-span-3 text-sm font-medium text-white truncate pr-2" title={p.product_name}>
                        {p.product_name}
                      </div>
                      <div className="hidden md:block md:col-span-2 text-xs text-slate-300">{p.property_type}</div>
                      <div className="hidden sm:block sm:col-span-3 md:col-span-2 text-xs text-slate-300">
                        {p.bedrooms} Bed / {p.bathrooms} Bath
                      </div>
                      <div className="col-span-3 sm:col-span-3 md:col-span-2 lg:col-span-1 text-sm font-semibold text-white">
                        ${p.price}/pw
                      </div>
                      <div className="hidden lg:block lg:col-span-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.is_pet_friendly === 1
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}>
                          {p.is_pet_friendly === 1 ? 'Pet Friendly' : 'No Pets'}
                        </span>
                      </div>
                      <div className="hidden xl:block xl:col-span-1 text-xs text-slate-400 truncate">{p.region_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Column: AI Chatbot (45%) */}
        <section className="flex-1 md:flex-[45] flex flex-col h-[520px] md:h-auto min-h-0 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-blue-500/10 shadow-xl relative overflow-hidden">

          {/* Header of Chatbot */}
          <div className="p-5 border-b border-blue-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">AI Copilot</h2>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>

          {/* Dialogue Messages Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-tr-none shadow-md shadow-blue-500/5'
                    : 'bg-slate-900/80 border border-blue-950/40 text-slate-100 rounded-tl-none'
                    }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Rendering Agent Node Execution Checklist */}
                  {msg.type === 'ai' && msg.nodes && (
                    <div className="mt-4 pt-3 border-t border-blue-950/30">
                      <span className="text-xs font-semibold text-slate-400 block mb-3">
                        Agent node execution progress:
                      </span>
                      <div className="relative pl-6 space-y-3.5 py-1">
                        {/* Connecting line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-blue-950/40" />

                        {NODE_STEPS.map((node) => {
                          const state = msg.nodes[node] || 'pending';
                          return (
                            <div key={node} className="flex items-center gap-3 relative">
                              {/* Glowing state bullet */}
                              <div className="absolute left-[-23px] flex items-center justify-center">
                                {state === 'success' ? (
                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                ) : state === 'running' ? (
                                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B] animate-pulse flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                ) : state === 'error' ? (
                                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_#EF4444] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-slate-700 bg-slate-900" />
                                )}
                              </div>
                              <span className={`text-xs font-medium ${state === 'success' ? 'text-emerald-400' :
                                state === 'running' ? 'text-amber-400' :
                                  state === 'error' ? 'text-red-400 font-semibold' : 'text-slate-500'
                                }`}>
                                {node}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rendering Custom Result Data Grid or Metrics KPI Cards */}
                  {msg.type === 'ai' && msg.resultData && (
                    msg.isMetricsResult ? (
                      <div className="mt-4 flex flex-col gap-2.5 bg-slate-950/45 p-3 rounded-xl border border-blue-500/10 backdrop-blur-md shadow-md">
                        <span className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase block mb-0.5">
                          Analysis Indicators
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {/* Avg Rent KPI */}
                          {msg.metrics.avgRent !== undefined && msg.metrics.avgRent !== null && (
                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-blue-950/40 flex flex-col items-center justify-center text-center shadow-inner">
                              <span className="text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-tight">Avg Rent</span>
                              <span className="text-xs font-bold text-white font-mono">
                                ${Number(msg.metrics.avgRent).toFixed(2)}
                              </span>
                              <span className="text-[8px] text-blue-500 mt-0.5">/ week</span>
                            </div>
                          )}
                          {/* Avg Lease Term KPI */}
                          {msg.metrics.avgLeaseTerm !== undefined && msg.metrics.avgLeaseTerm !== null && (
                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-blue-950/40 flex flex-col items-center justify-center text-center shadow-inner">
                              <span className="text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-tight">Avg Lease</span>
                              <span className="text-xs font-bold text-white font-mono">
                                {Number(msg.metrics.avgLeaseTerm).toFixed(1)}
                              </span>
                              <span className="text-[8px] text-blue-500 mt-0.5">months</span>
                            </div>
                          )}
                          {/* Total Rent KPI */}
                          {msg.metrics.totalRent !== undefined && msg.metrics.totalRent !== null && (
                            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-blue-950/40 flex flex-col items-center justify-center text-center shadow-inner">
                              <span className="text-[9px] text-slate-400 font-semibold mb-1 uppercase tracking-tight">Total Rev</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">
                                ${Number(msg.metrics.totalRent).toLocaleString()}
                              </span>
                              <span className="text-[8px] text-emerald-500/80 mt-0.5">total</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {msg.resultData.slice(0, 4).map((item) => (
                          <div
                            key={item.product_id}
                            className="bg-slate-950/40 p-2.5 rounded-lg border border-blue-950/40 text-xs flex flex-col gap-1"
                          >
                            <span className="font-semibold text-slate-100 truncate">{item.product_name}</span>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>{item.property_type}</span>
                              <span className="font-semibold text-blue-400">${item.price}/pw</span>
                            </div>
                          </div>
                        ))}
                        {msg.resultData.length > 4 && (
                          <div className="col-span-2 text-center text-[10px] text-slate-400 pt-1">
                            + {msg.resultData.length - 4} more listings updated in left table
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Form chat input at the bottom */}
          <form
            onSubmit={handleSendQuery}
            className="p-4 border-t border-blue-950/40 bg-slate-950/40 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask natural language query to filter properties..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isQuerying}
              className="flex-1 bg-slate-900 border border-blue-950/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden placeholder-slate-650 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isQuerying}
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${!inputMessage.trim() || isQuerying
                ? 'bg-blue-900/20 text-blue-500/30 border border-blue-900/10 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/20 hover:scale-[1.03] shadow-md shadow-blue-500/10'
                }`}
            >
              {isQuerying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </section>
      </main>

      {/* 3. Permanent Console Logs Section */}
      <footer className="hidden md:flex h-60 shrink-0 border-t border-blue-900/40 bg-slate-950/90 backdrop-blur-md z-40 relative flex flex-col shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        {/* Console Header */}
        <div className="h-11 px-6 flex items-center justify-between border-b border-blue-950/20 bg-slate-950/40 select-none">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">
              Developer Console Logs
            </span>
            <div className="flex items-center gap-1.5 ml-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-mono">Connected to remote backend server</span>
            </div>
          </div>
        </div>

        {/* Console Log Monospace Output */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-slate-300 space-y-2 scrollbar-thin bg-black/40">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`font-bold shrink-0 ${log.type === 'INFO' ? 'text-emerald-400' :
                log.type === 'WARN' ? 'text-amber-400' : 'text-red-400'
                }`}>
                [{log.type}]
              </span>
              {log.step && (
                <span className="text-blue-400 shrink-0 font-semibold">[{log.step}]</span>
              )}
              <span className="text-slate-200 select-text leading-relaxed">{log.info}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </footer>

      {/* Token Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-blue-900/40 rounded-2xl p-6 w-full max-w-5xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                Token 消耗查询
              </h3>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-slate-400 hover:text-white font-bold p-2 text-2xl leading-none">&times;</button>
            </div>

            {isTokenLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                <span className="text-sm">获取数据中...</span>
              </div>
            ) : tokenError ? (
              <div className="flex-1 flex items-center justify-center py-12 text-red-400 text-sm">
                Error: {tokenError}
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-thin pr-2 relative">
                {Array.isArray(tokenData) && tokenData.length > 0 ? (
                  (() => {
                    const groups = {};
                    tokenData.forEach(item => {
                      const reqId = item.request_id || 'Unknown Request';
                      if (!groups[reqId]) groups[reqId] = [];
                      groups[reqId].push(item);
                    });

                    return (
                      <div className="w-full min-w-[700px] pb-4">
                        <div className="grid grid-cols-12 px-3 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-blue-950/40 bg-slate-900/95 backdrop-blur-md rounded-lg mb-4 sticky top-0 z-10 shadow-sm">
                          <div className="col-span-2">Node</div>
                          <div className="col-span-2">Model</div>
                          <div className="col-span-2 text-right">Prompt</div>
                          <div className="col-span-2 text-right">Completion</div>
                          <div className="col-span-1 text-right">Total</div>
                          <div className="col-span-1 text-right">Cost (¥)</div>
                          <div className="col-span-2 text-right">Time</div>
                        </div>
                        <div className="flex flex-col gap-5">
                          {Object.entries(groups).map(([reqId, items], gIdx) => (
                            <div key={reqId} className="flex flex-col gap-2 bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
                              <div className="flex items-center gap-2 mb-1 px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]"></div>
                                <span className="text-xs font-semibold text-slate-300">
                                  Request ID: <span className="font-mono text-blue-400 ml-1">{reqId}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 ml-auto bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">
                                  {items.length} nodes
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {items.map((item, idx) => (
                                  <div key={item.id || idx} className="grid grid-cols-12 items-center px-3 py-2.5 bg-slate-900/60 border border-blue-950/20 rounded-xl hover:border-blue-500/30 hover:bg-slate-800/80 transition-all cursor-default">
                                    <div className="col-span-2 flex flex-col">
                                      <span className="text-sm font-medium text-white">{item.node_name}</span>
                                    </div>
                                    <div className="col-span-2 text-xs text-blue-300 truncate pr-2" title={item.model_name}>
                                      {item.model_name}
                                    </div>
                                    <div className="col-span-2 text-xs text-slate-300 text-right font-mono">{item.prompt_tokens}</div>
                                    <div className="col-span-2 text-xs text-slate-300 text-right font-mono">{item.completion_tokens}</div>
                                    <div className="col-span-1 text-sm font-semibold text-emerald-400 text-right font-mono">
                                      {item.total_tokens}
                                    </div>
                                    <div className="col-span-1 text-xs text-amber-400 text-right font-mono">
                                      {Number(item.cost_rmb) === 0 ? '0' : Number(item.cost_rmb).toFixed(6)}
                                    </div>
                                    <div className="col-span-2 text-[10px] text-slate-400 text-right whitespace-nowrap overflow-hidden text-ellipsis">
                                      {item.created_at}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm">
                    <Server className="w-8 h-8 text-slate-700 mb-3" />
                    <span>暂无 Token 消耗数据</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Console FAB Button */}
      <button
        onClick={() => setIsMobileConsoleOpen(true)}
        className="md:hidden fixed bottom-20 left-0 z-40 w-12 h-12  bg-slate-900 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
        title="Open Console"
      >
        <Terminal className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 animate-pulse border-2 border-slate-950" />
      </button>

      {/* Mobile Console Modal */}
      <div
        className={`fixed inset-0 z-50 md:hidden flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isMobileConsoleOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileConsoleOpen(false)}
      >
        <div
          className={`bg-slate-900 border border-blue-900/40 rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-lg shadow-2xl flex flex-col h-[65vh] transition-all duration-300 transform ${
            isMobileConsoleOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-blue-950/40">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-white">Developer Console Logs</span>
            </div>
            <button
              onClick={() => setIsMobileConsoleOpen(false)}
              className="text-slate-400 hover:text-white font-bold p-2 text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 font-mono text-[11px] text-slate-300 space-y-2 p-3 rounded-xl bg-black/40 border border-blue-950/20 scrollbar-thin">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`font-bold shrink-0 ${
                  log.type === 'INFO' ? 'text-emerald-400' : log.type === 'WARN' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  [{log.type}]
                </span>
                {log.step && (
                  <span className="text-blue-400 shrink-0 font-semibold">[{log.step}]</span>
                )}
                <span className="text-slate-200 select-text leading-relaxed">{log.info}</span>
              </div>
            ))}
            <div ref={mobileLogsEndRef} />
          </div>
        </div>
      </div>

    </div>
  );
}
