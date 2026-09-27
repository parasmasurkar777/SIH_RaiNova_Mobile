"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "../components/Navbar";
import { SubNavbar, SubNavTab } from "../components/SubNavbar";
import { WeatherPortalView } from "../components/WeatherPortalView";
import { EarlyWarningBanner } from "../components/EarlyWarningBanner";
import { ScenarioControls } from "../components/ScenarioControls";
import { DeckGLMapView } from "../components/DeckGLMapView";
import { ComponentInspector } from "../components/ComponentInspector";
import { runSimulation, fetchCascadingGraph, fetchLiveTelemetry, LiveTelemetry } from "../lib/api";
import { SimulationRequest, SimulationResponse, ComponentTelemetry, CascadingGraphResponse } from "../lib/types";
import { useLanguage } from "../lib/i18n/LanguageContext";
import OceanSkyBackground from "../components/OceanSkyBackground";
import { GitBranch, Trophy, Sliders, X, Minimize2, MapPin, AlertTriangle } from "lucide-react";

// Dynamic code-splitting for heavy modals to reduce initial JS bundle size and parse time
const CascadingGraphView = dynamic(
  () => import("../components/CascadingGraphView").then((mod) => mod.CascadingGraphView),
  { ssr: false }
);
const PriorityMatrix = dynamic(
  () => import("../components/PriorityMatrix").then((mod) => mod.PriorityMatrix),
  { ssr: false }
);
const CitizenReportModal = dynamic(
  () => import("../components/CitizenReportModal").then((mod) => mod.CitizenReportModal),
  { ssr: false }
);

export default function Home() {
  const { t, language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D");
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [isScenarioControlsOpen, setIsScenarioControlsOpen] = useState(false);
  const [leftDockTab, setLeftDockTab] = useState<"SANDBOX" | "HOTSPOTS">("SANDBOX");
  const [isLoading, setIsLoading] = useState(false);

  // Sub-Navbar Active Tab State
  const [activeSubNavTab, setActiveSubNavTab] = useState<SubNavTab>("TODAY");

  // Mobile Drawers Mutual Exclusivity State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileLayersOpen, setIsMobileLayersOpen] = useState(false);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsMobileLayersOpen(false);
        setIsScenarioControlsOpen(false);
      }
      return next;
    });
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleToggleMobileLayers = useCallback(() => {
    setIsMobileLayersOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsMobileMenuOpen(false);
        setIsScenarioControlsOpen(false);
      }
      return next;
    });
  }, []);

  const handleCloseMobileLayers = useCallback(() => {
    setIsMobileLayersOpen(false);
  }, []);

  // Portal View Mode ("MAP" for 3D digital twin map by default, "PORTAL" for weather dashboard)
  const [portalViewMode, setPortalViewMode] = useState<"PORTAL" | "MAP">("MAP");

  // 0-3h Timeline Selection State
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<number>(0);

  // Live Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTelemetry | null>(null);

  // Simulation State - Starts with Clear Sky (No Rain) Baseline
  const [simParams, setSimParams] = useState<SimulationRequest>({
    rainfall_mm_hr: 0.0,
    tide_level_m: 2.4,
    siltation_pct: 25.0,
    active_scenario_name: "Clear Weather Baseline",
  });

  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [graphData, setGraphData] = useState<CascadingGraphResponse | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentTelemetry | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial Load & Param Change Simulation
  const triggerSimulation = useCallback(async (params: SimulationRequest) => {
    setIsLoading(true);
    try {
      const res = await runSimulation(params);
      setSimResult(res);
      setSelectedTimelineIndex(0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    triggerSimulation(simParams);
    fetchCascadingGraph().then(setGraphData).catch(console.error);
    fetchLiveTelemetry().then(setLiveTelemetry).catch(console.error);
  }, [mounted]);

  // Live Telemetry Polling (Every 60s when LIVE ON)
  useEffect(() => {
    if (!mounted || !isLiveMode) return;

    let isSubscribed = true;

    const syncLive = async () => {
      try {
        const live = await fetchLiveTelemetry();
        if (live && isSubscribed) {
          setLiveTelemetry(live);
          const peakRain = live.citywide_max_rain_mm_hr ?? live.rainfall_mm_hr ?? 0;
          const activeScenarioName = live.primary_active_zone
            ? `Live Weather (${live.primary_active_zone.zone_name})`
            : "Real-Time Live Weather";
          const newP: SimulationRequest = {
            rainfall_mm_hr: peakRain,
            tide_level_m: live.tide_level_m || 2.8,
            siltation_pct: simParams.siltation_pct,
            active_scenario_name: activeScenarioName,
          };
          setSimParams(newP);
          triggerSimulation(newP);
        }
      } catch (e) {
        console.error("Live sync notice:", e);
      }
    };

    syncLive();
    const interval = setInterval(syncLive, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [mounted, isLiveMode]);

  const simTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    };
  }, []);

  const handleToggleLiveMode = useCallback(() => {
    setIsLiveMode((prev) => !prev);
  }, []);

  const handleParamChange = useCallback((newParams: SimulationRequest) => {
    setSimParams(newParams);
    if (simTimeoutRef.current) {
      clearTimeout(simTimeoutRef.current);
    }
    simTimeoutRef.current = setTimeout(() => {
      triggerSimulation(newParams);
    }, 150);
  }, [triggerSimulation]);

  const handleApplyPreset = useCallback((presetName: string, rain: number, tide: number, silt: number) => {
    if (simTimeoutRef.current) {
      clearTimeout(simTimeoutRef.current);
    }
    const newP: SimulationRequest = {
      rainfall_mm_hr: rain,
      tide_level_m: tide,
      siltation_pct: silt,
      active_scenario_name: presetName,
    };
    setSimParams(newP);
    triggerSimulation(newP);
  }, [triggerSimulation]);

  const handleSelectComponentById = useCallback((id: string) => {
    if (!simResult) return;
    const found = simResult.components.find((c) => c.component_id === id);
    if (found) {
      setSelectedComponent(found);
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setIsScenarioControlsOpen(false);
      }
    }
  }, [simResult]);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "2D" ? "3D" : "2D"));
  }, []);

  const handleOpenCitizenModal = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsMobileLayersOpen(false);
    setIsCitizenModalOpen(true);
  }, []);

  const handleCloseCitizenModal = useCallback(() => {
    setIsCitizenModalOpen(false);
  }, []);

  const handleOpenPriorityModal = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsMobileLayersOpen(false);
    setIsPriorityModalOpen(true);
  }, []);

  const handleClosePriorityModal = useCallback(() => {
    setIsPriorityModalOpen(false);
  }, []);

  const handleOpenGraphModal = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsMobileLayersOpen(false);
    setIsGraphModalOpen(true);
  }, []);

  const handleCloseGraphModal = useCallback(() => {
    setIsGraphModalOpen(false);
  }, []);

  const handleResetSimulation = useCallback(() => {
    handleApplyPreset("Normal Monsoon", 35, 2.5, 20);
  }, [handleApplyPreset]);

  const handleTogglePortalViewMode = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsMobileLayersOpen(false);
    setPortalViewMode((prev) => {
      const nextMode = prev === "PORTAL" ? "MAP" : "PORTAL";
      setActiveSubNavTab(nextMode === "MAP" ? "RADAR" : "TODAY");
      return nextMode;
    });
  }, []);

  const handleSubNavTabChange = useCallback((tab: SubNavTab) => {
    setIsMobileMenuOpen(false);
    setIsMobileLayersOpen(false);
    setActiveSubNavTab(tab);
    if (tab === "RADAR") {
      setPortalViewMode("MAP");
      setIsScenarioControlsOpen(true);
    } else if (tab === "HOURLY" || tab === "10-DAY" || tab === "TODAY" || tab === "MINUTECAST") {
      setPortalViewMode("PORTAL");
    }
  }, []);

  const handleToggleScenarioControls = useCallback(() => {
    setIsScenarioControlsOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsMobileMenuOpen(false);
        setIsMobileLayersOpen(false);
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setSelectedComponent(null);
        }
      }
      return next;
    });
  }, []);

  const handleOpenMapFromPortal = useCallback(() => {
    setPortalViewMode("MAP");
    setActiveSubNavTab("RADAR");
  }, []);

  const handleSelectComponent = useCallback((c: ComponentTelemetry) => {
    setSelectedComponent(c);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsScenarioControlsOpen(false);
    }
  }, []);

  const handleCloseComponentInspector = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  const handleSelectTimelineStep = useCallback((idx: number) => {
    setSelectedTimelineIndex(idx);
  }, []);

  // Active Components to render on 3D Map (respects 0-3h timeline scrubber)
  const displayedComponents = useMemo(() => {
    if (simResult?.timeline_forecast && simResult.timeline_forecast[selectedTimelineIndex]) {
      return simResult.timeline_forecast[selectedTimelineIndex].components;
    }
    return simResult?.components || [];
  }, [simResult, selectedTimelineIndex]);

  // Derived Top High-Risk Inundation Hotspots for Left Command Dock
  const topHotspots = useMemo(() => {
    return [...displayedComponents]
      .filter((c) => c.component_type === "HOTSPOT" || (c.water_depth_cm || 0) > 5.0 || (c.failure_risk_score || 0) > 25.0)
      .sort((a, b) => (b.failure_risk_score || 0) - (a.failure_risk_score || 0))
      .slice(0, 4);
  }, [displayedComponents]);



  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs select-none">
        INITIALIZING DIGITAL TWIN...
      </div>
    );
  }

  return (
    <>
      {/* Full-Body Fixed Interactive Procedural WebGL Ocean & Sky Shader Background (Static single-frame render in MAP and PORTAL modes to eliminate GPU fill-rate overhead during scrolling) */}
      <OceanSkyBackground isPaused={true} />

      <main className="h-screen w-screen bg-transparent text-slate-100 flex flex-col font-sans overflow-hidden">
        {/* Top Tactical Command Header (Unified 56px Single Bar) */}
        <Navbar
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        disruptionSeverity={simResult?.city_summary.disruption_severity || "NORMAL"}
        overallHealth={simResult?.city_summary.overall_infrastructure_health || 85}
        highTideWarning={simResult?.city_summary.high_tide_warning || false}
        onOpenCitizenModal={handleOpenCitizenModal}
        onResetSimulation={handleResetSimulation}
        isLiveMode={isLiveMode}
        onToggleLiveMode={handleToggleLiveMode}
        liveTelemetry={liveTelemetry}
        portalViewMode={portalViewMode}
        onTogglePortalViewMode={handleTogglePortalViewMode}
        onOpenPriorityModal={handleOpenPriorityModal}
        onOpenGraphModal={handleOpenGraphModal}
        onApplyPreset={handleApplyPreset}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={handleToggleMobileMenu}
        onCloseMobileMenu={handleCloseMobileMenu}
      />

      {/* Weather / Nowcasting Sub-Navbar - ONLY rendered when in Weather Portal mode! */}
      {portalViewMode === "PORTAL" && (
        <SubNavbar
          activeTab={activeSubNavTab}
          onTabChange={handleSubNavTabChange}
          onOpenPriorityModal={handleOpenPriorityModal}
          onOpenGraphModal={handleOpenGraphModal}
          onToggleScenarioControls={handleToggleScenarioControls}
          isLiveMode={isLiveMode}
          viewModeType={portalViewMode}
          onToggleViewModeType={handleTogglePortalViewMode}
        />
      )}

      {/* Main Viewport: Either Full Weather Portal Dashboard OR 3D Digital Twin Map */}
      {portalViewMode === "PORTAL" ? (
        <div className="flex-1 relative w-full overflow-hidden bg-transparent">
          <WeatherPortalView
            currentRainfallMmHr={simParams.rainfall_mm_hr}
            currentTideLevelM={simParams.tide_level_m}
            liveTelemetry={liveTelemetry}
            activeTab={activeSubNavTab}
            onSimulateScenario={handleApplyPreset}
            onOpenMap={handleOpenMapFromPortal}
            onOpenPriorityModal={handleOpenPriorityModal}
          />
        </div>
      ) : (
        <div className="flex-1 relative w-full overflow-hidden">
          {/* Full-Screen Background Deck.gl 3D Digital Twin Map (~90% Unobstructed Viewport) */}
          <DeckGLMapView
            components={displayedComponents}
            selectedComponentId={selectedComponent?.component_id || null}
            onSelectComponent={handleSelectComponent}
            viewMode={viewMode}
            rainfall_mm_hr={simParams.rainfall_mm_hr}
            tide_level_m={simParams.tide_level_m}
            isMobileLayersOpen={isMobileLayersOpen}
            onToggleMobileLayers={handleToggleMobileLayers}
            onCloseMobileLayers={handleCloseMobileLayers}
          />

          {/* Unified Left Slide-out Command Deck (Sandbox + High-Risk Hotspots) */}
          <div className="absolute top-3 sm:top-4 left-2 sm:left-4 z-20 flex flex-col items-start gap-2 max-w-[calc(100vw-1rem)] sm:max-w-md">
            {isScenarioControlsOpen ? (
              <div
                className="w-full sm:w-[420px] md:w-[460px] max-w-[calc(100vw-1rem)] max-h-[calc(100dvh-130px)] sm:max-h-[calc(100vh-140px)] flex flex-col bg-slate-950/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden animate-fadeIn"
              >
                {/* Header with Segmented Tab */}
                <div className="flex items-center justify-between p-2 sm:p-2.5 border-b border-white/15 bg-slate-900/60">
                  <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-white/15 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setLeftDockTab("SANDBOX")}
                      className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        leftDockTab === "SANDBOX"
                          ? "bg-amber-400 text-slate-950 shadow-md border border-amber-300 ring-1 ring-amber-300/30 font-extrabold"
                          : "bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] border border-white/5 font-semibold"
                      }`}
                    >
                      <Sliders className={`w-3.5 h-3.5 ${leftDockTab === "SANDBOX" ? "text-slate-950" : "text-amber-400"}`} />
                      <span>{t("tabSandbox", "Sandbox Controls")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeftDockTab("HOTSPOTS")}
                      className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        leftDockTab === "HOTSPOTS"
                          ? "bg-red-500 text-white shadow-md border border-red-400 ring-1 ring-red-400/30 font-extrabold"
                          : "bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/[0.08] border border-white/5 font-semibold"
                      }`}
                    >
                      <AlertTriangle className={`w-3.5 h-3.5 ${leftDockTab === "HOTSPOTS" ? "text-white" : "text-red-400"}`} />
                      <span>{t("tabHotspots", "High-Risk Hotspots")} ({topHotspots.length})</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsScenarioControlsOpen(false); }}
                    className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-300 hover:text-white transition-colors"
                    title="Minimize Command Dock"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content Body */}
                <div className="p-2.5 sm:p-3 overflow-y-auto max-h-[calc(100dvh-200px)] custom-scrollbar">
                  {leftDockTab === "SANDBOX" ? (
                    <ScenarioControls
                      params={simParams}
                      onChange={handleParamChange}
                      isLoading={isLoading}
                      onApplyPreset={handleApplyPreset}
                      timelineForecast={simResult?.timeline_forecast || []}
                      selectedTimelineIndex={selectedTimelineIndex}
                      onSelectTimelineStep={handleSelectTimelineStep}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 sm:gap-2.5">
                      <div className="text-[10.5px] sm:text-[11px] text-slate-200 font-mono font-bold mb-0.5 uppercase tracking-wider px-1">
                        {language === 'hi' ? 'उच्च जोखिम वाले सबवे एवं जलभराव स्थल:' : language === 'mr' ? 'अतिधोकादायक सबवे व पाणी साचण्याची ठिकाणे:' : 'High-Risk Subways & Chronic Inundation Nodes:'}
                      </div>
                      {topHotspots.map((zone) => (
                        <div
                          key={zone.component_id}
                          onClick={() => setSelectedComponent(zone)}
                          className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                            selectedComponent?.component_id === zone.component_id
                              ? "bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50"
                              : "bg-slate-900/85 hover:bg-slate-800/85 border-white/15 hover:border-amber-400/50 text-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{zone.name}</span>
                            </span>
                            <span className={`text-[9.5px] sm:text-[10px] font-mono px-2 py-0.5 rounded-lg border font-bold shrink-0 ml-1 ${
                              zone.status === "CRITICAL"
                                ? "bg-red-500/25 text-red-200 border-red-400/60"
                                : "bg-amber-500/25 text-amber-200 border-amber-400/60"
                            }`}>
                              {zone.failure_risk_score}% {language === 'hi' ? 'जोखिम' : language === 'mr' ? 'धोका' : 'RISK'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300 font-medium">{t("wardLabel", "Ward")} {zone.ward} • Elev: +{zone.elevation_m}m</div>
                          <div className="flex items-center justify-between text-[10px] mt-2 font-mono text-cyan-300 border-t border-white/10 pt-1.5">
                            <span>{language === 'hi' ? 'गहराई' : language === 'mr' ? 'खोली' : 'Depth'}: <b className="text-white">{zone.water_depth_cm} cm</b></span>
                            <span>{language === 'hi' ? 'गति' : language === 'mr' ? 'वेग' : 'Speed'}: <b className="text-white">{zone.traffic_speed_kmh} km/h</b></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setSelectedComponent(null);
                  }
                  setIsScenarioControlsOpen(true);
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold text-white bg-slate-950/90 border border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-cyan-400/50 transition-all hover:scale-105 backdrop-blur-xl"
              >
                <Sliders className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-300 shrink-0" />
                <span>{t("commandDeckTitle", "Command Deck & Hotspots")} ({topHotspots.length})</span>
              </button>
            )}
          </div>

          {/* Floating Right: Component Inspector Panel */}
          {selectedComponent && (
            <div
              className="absolute top-14 sm:top-4 right-2 sm:right-4 z-20 animate-fadeIn max-w-[calc(100vw-1rem)]"
            >
              <ComponentInspector
                component={selectedComponent}
                onClose={handleCloseComponentInspector}
              />
            </div>
          )}

          {/* Floating Action Bar: Dual AI & Priority Dispatch (Elevated to clear bottom ticker) */}
          <div className="absolute bottom-13 sm:bottom-11 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-2 glass-panel p-1 sm:p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/15 max-w-[calc(100vw-1rem)] overflow-x-auto no-scrollbar touch-scroll">
            <button
              type="button"
              onClick={handleOpenGraphModal}
              className="glass-button shrink-0 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] border border-purple-500/40 hover:scale-105 transition-all whitespace-nowrap"
              title="Open Graph Neural Network Cascading Failure Explorer"
            >
              <GitBranch className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden xs:inline">{language === 'hi' ? 'कैस्केडिंग ग्राफ' : language === 'mr' ? 'कॅस्केडिंग आलेख' : 'Cascading Graph'}</span>
              <span className="xs:hidden">Graph</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-200 font-mono text-[9px] font-bold border border-purple-400/30 shrink-0">
                {graphData?.total_impacted_nodes || 4}
              </span>
            </button>

            <div className="h-4 w-px bg-white/15 shrink-0" />

            <button
              type="button"
              onClick={handleOpenPriorityModal}
              className="glass-button shrink-0 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] border border-amber-500/40 hover:scale-105 transition-all whitespace-nowrap"
              title="Open SIH Multi-Sector Priority Repair & Dispatch Matrix"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden xs:inline">{language === 'hi' ? 'प्राथमिकता मैट्रिक्स' : language === 'mr' ? 'प्राधान्य मॅट्रिक्स' : 'Priority Matrix'}</span>
              <span className="xs:hidden">Priority</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/25 text-amber-200 font-mono text-[9px] font-bold border border-amber-400/30 shrink-0">
                {simResult?.top_priorities?.length || 5}
              </span>
            </button>
          </div>

          {/* Bottom Live Radar Telemetry Ticker */}
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <EarlyWarningBanner
              telemetry={liveTelemetry}
              components={displayedComponents}
              currentRainfallMmHr={simParams.rainfall_mm_hr}
              onSimulateRainfall={(rain) => handleApplyPreset("Incoming Storm (+30m Nowcast)", rain, 4.1, 45)}
              onSelectComponent={handleSelectComponent}
            />
          </div>
        </div>
      )}

      {/* Cascading Failure Graph Modal Overlay */}
      {isGraphModalOpen && graphData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="glass-modal rounded-3xl p-6 w-full max-w-5xl shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] text-slate-100 flex flex-col gap-4 max-h-[90vh] border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <GitBranch className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <h3 className="text-sm uppercase tracking-wider text-white glass-text-glow">
                  Infrastructure Graph Cascading Failure Explorer
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseGraphModal}
                className="glass-button p-1.5 rounded-xl text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CascadingGraphView
                graphData={graphData}
                components={displayedComponents}
                selectedNodeId={selectedComponent?.component_id || null}
                rainfallMmHr={simParams.rainfall_mm_hr}
                siltationPct={simParams.siltation_pct}
                onSelectNode={handleSelectComponentById}
                onCloseAndFocus={(id) => {
                  handleSelectComponentById(id);
                  handleCloseGraphModal();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SIH Priority Queue Modal Overlay */}
      {isPriorityModalOpen && simResult && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="glass-modal rounded-3xl p-6 w-full max-w-5xl shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] text-slate-100 flex flex-col gap-4 max-h-[90vh] border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <h3 className="text-sm uppercase tracking-wider text-white glass-text-glow">
                  SIH Multi-Sector Priority Repair & Dispatch Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClosePriorityModal}
                className="glass-button p-1.5 rounded-xl text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PriorityMatrix
                priorities={simResult.top_priorities}
                onSelectHotspot={(id) => {
                  handleSelectComponentById(id);
                  handleClosePriorityModal();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Citizen Grievance Reporting Modal */}
      <CitizenReportModal
        isOpen={isCitizenModalOpen}
        onClose={handleCloseCitizenModal}
      />
    </main>
    </>
  );
}
