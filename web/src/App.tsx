import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricsBar } from './components/MetricsBar';
import { FunctionsPanel } from './components/FunctionsPanel';
import { DisassemblyViewer } from './components/DisassemblyViewer';
import { SectionsPanel } from './components/SectionsPanel';
import { StringsPanel } from './components/StringsPanel';
import { XrefsPanel } from './components/XrefsPanel';
import { BinaryLoaderModal } from './components/BinaryLoaderModal';
import { analysisClient } from './services/apiClient';
import type {
  ActiveTab,
  BinaryMetadata,
  BinarySection,
  BinaryFunction,
  FunctionDisassembly,
  BinaryString,
  XRefData,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('functions');
  const [selectedFunction, setSelectedFunction] = useState<string>('entry0');
  const [isLoaderOpen, setIsLoaderOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [metadata, setMetadata] = useState<BinaryMetadata | null>(null);
  const [sections, setSections] = useState<BinarySection[]>([]);
  const [functions, setFunctions] = useState<BinaryFunction[]>([]);
  const [disassembly, setDisassembly] = useState<FunctionDisassembly | null>(null);
  const [strings, setStrings] = useState<BinaryString[]>([]);
  const [xrefs, setXrefs] = useState<XRefData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const serverStatus = await analysisClient.checkServerStatus();
      setIsLive(serverStatus.online);

      const [metaData, secData, funcData, strData, xrefData] = await Promise.all([
        analysisClient.getMetadata(),
        analysisClient.getSections(),
        analysisClient.getFunctions(),
        analysisClient.getStrings(),
        analysisClient.getXrefs(selectedFunction || 'entry0'),
      ]);

      setMetadata(metaData);
      setSections(secData);
      setFunctions(funcData);
      setStrings(strData);
      setXrefs(xrefData);

      const initialFunc = funcData.length > 0 ? funcData[0].name : 'entry0';
      setSelectedFunction(initialFunc);
      const disasm = await analysisClient.getDisassembly(initialFunc);
      setDisassembly(disasm);
    } catch (err) {
      console.error('Failed to load analysis data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFunction]);

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  // Update disassembly when selected function changes
  useEffect(() => {
    if (!selectedFunction) return;
    async function updateDisasm() {
      try {
        const disasm = await analysisClient.getDisassembly(selectedFunction);
        setDisassembly(disasm);
      } catch (err) {
        console.error(`Failed to disassemble ${selectedFunction}:`, err);
      }
    }
    updateDisasm();
  }, [selectedFunction]);

  if (loading || !metadata) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Initializing 4nsics-re-agent workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        metadata={metadata}
        onOpenLoader={() => setIsLoaderOpen(true)}
        isLive={isLive}
        functionCount={functions.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Header / Metrics & Memory Layout */}
        <MetricsBar metadata={metadata} sections={sections} />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 flex overflow-hidden">
          {activeTab === 'functions' && (
            <>
              {/* Functions List on the Left */}
              <div className="w-80 h-full shrink-0">
                <FunctionsPanel
                  functions={functions}
                  selectedFunction={selectedFunction}
                  onSelectFunction={setSelectedFunction}
                />
              </div>

              {/* Code & Disassembly Viewer on the Right */}
              <DisassemblyViewer
                disassembly={disassembly}
                onSelectAddress={(addr) => {
                  const match = functions.find((f) => f.offset === addr);
                  if (match) setSelectedFunction(match.name);
                }}
              />
            </>
          )}

          {activeTab === 'sections' && <SectionsPanel sections={sections} />}

          {activeTab === 'strings' && <StringsPanel strings={strings} />}

          {activeTab === 'xrefs' && (
            <XrefsPanel
              xrefs={xrefs}
              onSelectAddress={(addr) => {
                const match = functions.find((f) => f.offset === addr);
                if (match) {
                  setSelectedFunction(match.name);
                  setActiveTab('functions');
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Binary Loader Modal */}
      <BinaryLoaderModal
        isOpen={isLoaderOpen}
        onClose={() => setIsLoaderOpen(false)}
        onBinaryLoaded={() => loadData()}
      />
    </div>
  );
}

export default App;
