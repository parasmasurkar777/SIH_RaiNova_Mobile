"use client";

import React, { useState, useEffect } from "react";
import { SimulationRequest, TimelineForecastStep } from "../lib/types";
import { Sliders, CloudRain, Waves, Trash2, Clock, Play, Pause } from "lucide-react";
import { useLanguage } from "../lib/i18n/LanguageContext";

interface ScenarioControlsProps {
  params: SimulationRequest;
  onChange: (newParams: SimulationRequest) => void;
  isLoading: boolean;
  onApplyPreset: (name: string, rain: number, tide: number, silt: number) => void;
  timelineForecast?: TimelineForecastStep[];
  selectedTimelineIndex?: number;
  onSelectTimelineStep?: (index: number) => void;
}

const ScenarioControlsComponent: React.FC<ScenarioControlsProps> = ({
  params,
  onChange,
  isLoading,
  onApplyPreset,
  timelineForecast = [],
  selectedTimelineIndex = 0,
  onSelectTimelineStep,
}) => {
  const { t } = useLanguage();
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlayingTimeline || !timelineForecast.length) return;

    const timer = setInterval(() => {
      if (onSelectTimelineStep) {
        const nextIndex = (selectedTimelineIndex + 1) % timelineForecast.length;
        onSelectTimelineStep(nextIndex);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [isPlayingTimeline, selectedTimelineIndex, timelineForecast.length, onSelectTimelineStep]);

  const presets = [
    { name: "Clear Sky Baseline", rain: 0, tide: 2.4, silt: 20, label: t("condClear", "Clear Sky"), icon: "☀️", desc: "0mm/h • 2.4m" },
    { name: "Normal Monsoon", rain: 35, tide: 2.5, silt: 25, label: t("presetNormal", "Normal Monsoon Baseline"), icon: "🌤️", desc: "35mm/h • 2.5m" },
    { name: "Heavy Downpour (150mm)", rain: 150, tide: 4.2, silt: 50, label: t("presetHighTide", "High Tide Lockout (4.6m)"), icon: "🌧️", desc: "150mm/h • 4.2m" },
    { name: "26/7 Cloudburst Surge", rain: 260, tide: 4.8, silt: 80, label: t("presetCloudburst", "Cloudburst Emergency"), icon: "⚡", desc: "260mm/h • 4.8m" },
  ];

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5 text-slate-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            {t("whatIfSandboxTitle", "Scenario Sandbox & What-If")}
          </h2>
        </div>
        {isLoading && (
          <span className="text-[10px] font-mono font-bold text-cyan-200 flex items-center gap-1.5 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-400/40">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            {t("computingMl", "Computing ML...")}
          </span>
        )}
      </div>

      {/* 0-3 Hour Predictive Timeline Scrubber */}
      {timelineForecast.length > 0 && (
        <div className="bg-slate-900/90 p-2.5 sm:p-3 rounded-2xl border border-cyan-400/30 flex flex-col gap-2.5 shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-bold text-cyan-200">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-bold tracking-wider text-cyan-200 uppercase">
                {t("nowcastTimeline03h", "0-3H NOWCAST TIMELINE:")}
              </span>
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPlayingTimeline(!isPlayingTimeline);
                }}
                className={`px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                  isPlayingTimeline
                    ? "bg-amber-500/30 border-amber-400 text-amber-200 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    : "bg-white/[0.08] hover:bg-white/[0.15] border-white/15 text-slate-200 hover:text-white"
                }`}
                title={isPlayingTimeline ? t("pauseBtn", "Pause") : t("playBtn", "Play")}
              >
                {isPlayingTimeline ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-cyan-400" />}
                <span>{isPlayingTimeline ? t("pauseBtn", "Pause") : t("playBtn", "Play")}</span>
              </button>

              <span className="font-mono text-white font-extrabold text-[11px] sm:text-xs bg-slate-950/80 px-2 py-0.5 rounded border border-white/15">
                {timelineForecast[selectedTimelineIndex]?.time_offset}
              </span>
            </div>
          </div>

          {/* Time Tabs */}
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
            {timelineForecast.map((step, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onSelectTimelineStep) {
                    onSelectTimelineStep(idx);
                  }
                }}
                className={`py-1.5 sm:py-2 rounded-xl text-[10px] font-mono font-bold transition-all border min-h-[32px] sm:min-h-[36px] flex items-center justify-center ${
                  selectedTimelineIndex === idx
                    ? "bg-cyan-600 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-[1.03] ring-1 ring-cyan-300/40"
                    : "bg-slate-800/90 hover:bg-slate-700/90 border-white/15 text-slate-200 hover:text-white"
                }`}
              >
                {step.time_offset.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-200 pt-1 border-t border-white/10">
            <span>{t("rainfallRate", "Rain")}: <strong className="text-cyan-300 font-bold">{timelineForecast[selectedTimelineIndex]?.predicted_rainfall_mm_hr} mm/h</strong></span>
            <span>{t("waterDepthLabel", "Peak Depth")}: <strong className="text-cyan-300 font-bold">{timelineForecast[selectedTimelineIndex]?.city_max_depth_cm}cm</strong></span>
            <span>{t("criticalSpotsCount", "Critical")}: <strong className="text-red-300 font-bold">{timelineForecast[selectedTimelineIndex]?.critical_hotspots_count}</strong></span>
          </div>
        </div>
      )}

      {/* Scenario Presets - Responsive 2x2 Grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200 mb-0.5 px-1">
          {t("stressTestPresets", "Monsoon Stress-Test Presets:")}
        </span>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const isActive = params.rainfall_mm_hr === preset.rain;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onApplyPreset(preset.name, preset.rain, preset.tide, preset.silt);
                }}
                className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[64px] ${
                  isActive
                    ? "bg-amber-950/70 border-amber-400 text-white shadow-[0_0_16px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50"
                    : "bg-slate-900/85 hover:bg-slate-800/85 border-white/15 text-slate-200 hover:text-white"
                }`}
              >
                <div className="flex items-start gap-1.5 w-full">
                  <span className="text-xs shrink-0 mt-0.5">{preset.icon}</span>
                  <span className={`text-[10px] sm:text-[11px] font-bold leading-tight ${isActive ? "text-amber-200" : "text-white"}`}>
                    {preset.label}
                  </span>
                </div>
                <span className="text-[9.5px] font-mono text-slate-300 mt-1 font-medium">{preset.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-2.5 sm:gap-3 pt-1 border-t border-white/10">
        {/* Rainfall */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {t("rainfallSlider", "Rainfall Rate")}:
            </span>
            <span className="font-mono font-bold text-blue-300 text-xs bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-400/30">{params.rainfall_mm_hr} mm/h</span>
          </div>
          <input
            type="range"
            min="0"
            max="300"
            step="5"
            value={params.rainfall_mm_hr}
            onChange={(e) => onChange({ ...params, rainfall_mm_hr: parseFloat(e.target.value) })}
            className="w-full h-2.5 sm:h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400 border border-white/10 touch-pan-y"
          />
        </div>

        {/* Tide Level */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {t("tideSlider", "Arabian Sea Tide")}:
            </span>
            <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-400/30">{params.tide_level_m} m</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.5"
            step="0.1"
            value={params.tide_level_m}
            onChange={(e) => onChange({ ...params, tide_level_m: parseFloat(e.target.value) })}
            className="w-full h-2.5 sm:h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-white/10 touch-pan-y"
          />
        </div>

        {/* Siltation */}
        <div className="flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Trash2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {t("siltationSlider", "Drain Siltation")}:
            </span>
            <span className="font-mono font-bold text-amber-300 text-xs bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-400/30">{params.siltation_pct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={params.siltation_pct}
            onChange={(e) => onChange({ ...params, siltation_pct: parseFloat(e.target.value) })}
            className="w-full h-2.5 sm:h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 border border-white/10 touch-pan-y"
          />
        </div>
      </div>
    </div>
  );
};

export const ScenarioControls = React.memo(ScenarioControlsComponent);

