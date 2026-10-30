"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";

const defaultSizePresets = [
  { label: "Square", value: "1024x1024", ratio: "1:1" },
  { label: "Portrait", value: "1024x1792", ratio: "9:16" },
  { label: "Landscape", value: "1792x1024", ratio: "16:9" },
  { label: "Wide", value: "1920x1080", ratio: "16:9" },
  { label: "Custom", value: "custom", ratio: "?" },
];

const defaultQualityOptions = [
  { label: "Standard", value: "standard", desc: "Fast, good quality" },
  { label: "HD", value: "hd", desc: "Balanced" },
  { label: "Ultra", value: "ultra", desc: "Best quality, slower" },
];

const styleOptions = [
  { label: "Vivid", value: "vivid" },
  { label: "Natural", value: "natural" },
  { label: "Cinematic", value: "cinematic" },
  { label: "Anime", value: "anime" },
  { label: "3D render", value: "3d-render" },
  { label: "Sketch", value: "sketch" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const fadeItem = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  stability: "Stability",
  replicate: "Replicate",
};

function ratioLabel(width: number, height: number) {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-neutral ui-transition"
      style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* Registration marks around the canvas */
function CropMarks() {
  const corner = "absolute h-3 w-3 border-rule-2";
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={`${corner} -left-2 -top-2 border-l border-t`} />
      <span className={`${corner} -right-2 -top-2 border-r border-t`} />
      <span className={`${corner} -bottom-2 -left-2 border-b border-l`} />
      <span className={`${corner} -bottom-2 -right-2 border-b border-r`} />
    </span>
  );
}

/* Collapsible section */
function Section({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-rule last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="group flex h-10 w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-medium text-muted group-hover:text-ink ui-transition">
          {label}
        </span>
        <Chevron open={open} />
      </button>
      <div
        className="grid transition-[grid-template-rows]"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          transitionDuration: "var(--dur-long)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Studio() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState("1024x1024");
  const [selectedQuality, setSelectedQuality] = useState("hd");
  const [selectedStyle, setSelectedStyle] = useState("vivid");
  const [batchCount, setBatchCount] = useState(1);
  const [seed, setSeed] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNegative, setShowNegative] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [provider, setProvider] = useState("openai");
  const [selectedModel, setSelectedModel] = useState("gpt-image-2");
  const [customWidth, setCustomWidth] = useState("1024");
  const [customHeight, setCustomHeight] = useState("1024");
  const [gptImage2Background, setGptImage2Background] = useState("auto");
  const [referenceImages, setReferenceImages] = useState<{ url: string; file?: File }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("frame_settings");
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.provider) setProvider(settings.provider);
        if (settings.selectedModel) {
          setSelectedModel(settings.selectedModel);
          if (settings.selectedModel === "gpt-image-2") {
            setSelectedQuality("auto");
            setSelectedSize("1024x1024");
          } else {
            if (settings.sizePreset) {
              const normalizedSize = settings.sizePreset.replace("×", "x");
              setSelectedSize(normalizedSize);
            }
          }
        }
      }
      setSettingsLoaded(true);
    } catch (e) {
      console.error("Failed to load settings in Studio", e);
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      referenceImages.forEach((img) => {
        if (img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  const isGptImage2 = selectedModel === "gpt-image-2";

  const sizePresets = isGptImage2
    ? [
        { label: "Square", value: "1024x1024", ratio: "1:1" },
        { label: "Portrait", value: "1024x1792", ratio: "9:16" },
        { label: "Landscape", value: "1792x1024", ratio: "16:9" },
        { label: "4K Square", value: "2048x2048", ratio: "1:1" },
        { label: "4K Landscape", value: "3840x2160", ratio: "16:9" },
        { label: "4K Portrait", value: "2160x3840", ratio: "9:16" },
        { label: "Custom", value: "custom", ratio: "?" },
      ]
    : defaultSizePresets;

  const qualityOptions = isGptImage2
    ? [
        { label: "Auto", value: "auto", desc: "Automatic quality" },
        { label: "Low", value: "low", desc: "Fast, lower quality" },
        { label: "Medium", value: "medium", desc: "Balanced details" },
        { label: "High", value: "high", desc: "Maximum fidelity" },
      ]
    : defaultQualityOptions;

  const supportsImageInput =
    selectedModel.toLowerCase().includes("gpt-image-2") ||
    selectedModel.toLowerCase().includes("gpt-image-1") ||
    selectedModel.toLowerCase().includes("flux-1.1-pro") ||
    selectedModel.toLowerCase().includes("flux-schnell") ||
    selectedModel.toLowerCase().includes("stable-diffusion-xl") ||
    selectedModel.toLowerCase().includes("sdxl") ||
    selectedModel.toLowerCase().includes("sd3");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (supportsImageInput) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!supportsImageInput) return;
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const imgFiles = files.filter((f) => f.type.startsWith("image/"));
    const newRefs = imgFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setReferenceImages((prev) => [...prev, ...newRefs]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveReferenceImage = (idx: number) => {
    setReferenceImages((prev) => {
      const copy = [...prev];
      if (copy[idx].url.startsWith("blob:")) {
        URL.revokeObjectURL(copy[idx].url);
      }
      copy.splice(idx, 1);
      return copy;
    });
  };

  useEffect(() => {
    if (isGptImage2) {
      if (!["auto", "low", "medium", "high"].includes(selectedQuality)) {
        setSelectedQuality("auto");
      }
    } else {
      if (!["standard", "hd", "ultra"].includes(selectedQuality)) {
        setSelectedQuality("hd");
      }
    }
  }, [selectedModel]);

  const [generatedImages, setGeneratedImages] = useState<
    { id: number; url: string; prompt: string; date: string; size: string; model: string; favorite: boolean }[]
  >([]);

  /* Load generations on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("frame_generations");
      if (stored) {
        setGeneratedImages(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load generations in Studio", e);
    }
  }, []);

  const saveGenerationsToLocalStorage = (newImgs: any[]) => {
    if (typeof window === "undefined") return;
    try {
      const existing = JSON.parse(localStorage.getItem("frame_generations") || "[]");
      const updated = [...newImgs, ...existing];
      localStorage.setItem("frame_generations", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save generations to local storage", e);
    }
  };
  const batchSliderRef = useRef<HTMLInputElement>(null);

  const cycleCanvasSize = () => {
    setSelectedSize((current) => {
      const idx = sizePresets.findIndex((p) => p.value === current);
      const nextIdx = (idx + 1) % sizePresets.length;
      return sizePresets[nextIdx].value;
    });
  };

  const cycleQuality = () => {
    setSelectedQuality((current) => {
      const idx = qualityOptions.findIndex((o) => o.value === current);
      const nextIdx = (idx + 1) % qualityOptions.length;
      return qualityOptions[nextIdx].value;
    });
  };

  const cycleStyle = () => {
    setSelectedStyle((current) => {
      const idx = styleOptions.findIndex((s) => s.value === current);
      const nextIdx = (idx + 1) % styleOptions.length;
      return styleOptions[nextIdx].value;
    });
  };

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [prompt]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Generate (Command/Ctrl + Enter)
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }

      // 2. Focus prompt (Alt + P)
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        textareaRef.current?.focus();
      }

      // 3. Toggle negative prompt (Alt + N)
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowNegative((prev) => !prev);
      }

      // 4. Cycle Canvas presets (Alt + C)
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        cycleCanvasSize();
      }

      // 5. Cycle Quality options (Alt + Q)
      if (e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        cycleQuality();
      }

      // 6. Cycle Style options (Alt + S)
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        cycleStyle();
      }

      // 7. Focus Batch slider (Alt + B)
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        batchSliderRef.current?.focus();
      }

      // 8. Close error modal (Escape)
      if (e.key === "Escape" && showErrorModal) {
        e.preventDefault();
        setShowErrorModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    prompt,
    batchCount,
    selectedSize,
    selectedQuality,
    selectedStyle,
    customWidth,
    customHeight,
    gptImage2Background,
    isDragging,
    referenceImages,
    provider,
    selectedModel,
    showErrorModal
  ]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to convert image URL to base64", e);
      return url; // fallback to raw URL
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStatus("Starting...");

    // Load latest settings from local storage
    let currentSettings = {
      provider: "openai",
      apiKey: "",
      apiBaseUrl: "",
      selectedModel: "gpt-image-2",
    };
    try {
      const stored = localStorage.getItem("frame_settings");
      if (stored) {
        currentSettings = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    const { provider: settingsProvider, apiKey, apiBaseUrl, selectedModel: settingsModel } = currentSettings;

    // Check if API Key is configured. If not, use mock generation.
    if (!apiKey) {
      setGenerationStatus("Connecting (Mock)...");
      setTimeout(() => {
        const newImages = Array.from({ length: batchCount }, (_, i) => {
          const id = Date.now() + i;
          const width = selectedSize === "custom" ? Number(customWidth) || 1024 : 1024;
          const height = selectedSize === "custom" ? Number(customHeight) || 1024 : 1024;
          return {
            id,
            url: `https://picsum.photos/seed/${id}/${width}/${height}`,
            prompt: prompt,
            date: new Date().toISOString().split("T")[0],
            size: selectedSize === "custom" ? `${customWidth}×${customHeight}` : selectedSize.replace("x", "×"),
            model: settingsModel,
            favorite: false,
          };
        });

        setGeneratedImages((prev) => [...newImages, ...prev]);
        saveGenerationsToLocalStorage(newImages);
        setIsGenerating(false);
        setGenerationStatus("");
      }, 1500);
      return;
    }

    // Define the call with retry up to 5 times
    const maxRetries = 5;
    const executeWithRetry = async (attempt = 1): Promise<any> => {
      try {
        if (attempt > 1) {
          setGenerationStatus(`Retrying (Attempt ${attempt}/5)...`);
        } else {
          setGenerationStatus("Connecting...");
        }

        if (settingsProvider === "openai") {
          const baseUrl = apiBaseUrl || "https://api.openai.com/v1";
          const endpoint = `${baseUrl}/images/generations`;

          const sizeParam = selectedSize === "custom" ? `${customWidth}x${customHeight}` : selectedSize;
          const body: Record<string, any> = {
            model: settingsModel,
            prompt: prompt,
            n: batchCount,
            size: sizeParam,
          };

          const isGptImage = settingsModel.toLowerCase().includes("gpt-image");

          if (isGptImage) {
            body.quality = selectedQuality; // 'auto', 'low', 'medium', 'high'
            body.background = gptImage2Background; // 'auto', 'opaque'
          } else {
            body.response_format = "b64_json";
            // DALL-E 3 only supports 'standard' or 'hd'
            body.quality = selectedQuality === "high" || selectedQuality === "hd" || selectedQuality === "ultra" ? "hd" : "standard";
          }

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `OpenAI API returned status ${res.status}`);
          }

          return await res.json();
        } else if (settingsProvider === "stability") {
          const baseUrl = apiBaseUrl || "https://api.stability.ai/v2beta";
          const endpoint = `${baseUrl}/stable-image/generate/core`;

          const formData = new FormData();
          formData.append("prompt", prompt);
          formData.append("output_format", "webp");
          
          let aspect = "1:1";
          if (selectedSize === "1024x1792" || selectedSize === "2160x3840") aspect = "9:16";
          else if (selectedSize === "1792x1024" || selectedSize === "3840x2160" || selectedSize === "1920x1080") aspect = "16:9";
          formData.append("aspect_ratio", aspect);

          if (referenceImages.length > 0 && referenceImages[0].file) {
            formData.append("image", referenceImages[0].file);
            formData.append("strength", "0.7");
          }

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Accept": "application/json"
            },
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.errors?.[0] || errData.message || `Stability API returned status ${res.status}`);
          }

          return await res.json();
        } else if (settingsProvider === "replicate") {
          const baseUrl = apiBaseUrl || "https://api.replicate.com/v1";
          const endpoint = `${baseUrl}/predictions`;

          const body: Record<string, any> = {
            version: settingsModel.includes("flux-1.1-pro") 
              ? "flux-1.1-pro" 
              : settingsModel.includes("flux-schnell")
              ? "flux-schnell"
              : "sdxl",
            input: {
              prompt: prompt,
            }
          };

          if (referenceImages.length > 0 && referenceImages[0].file) {
            const base64 = await convertFileToBase64(referenceImages[0].file);
            body.input.image = base64;
          }

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Token ${apiKey}`,
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || `Replicate API returned status ${res.status}`);
          }

          const prediction = await res.json();
          let pollUrl = prediction.urls.get || `${baseUrl}/predictions/${prediction.id}`;
          let completedPrediction = prediction;
          let attempts = 0;

          while (completedPrediction.status !== "succeeded" && completedPrediction.status !== "failed" && attempts < 30) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setGenerationStatus(`Polling Replicate (${attempts + 1})...`);
            const pollRes = await fetch(pollUrl, {
              headers: {
                "Authorization": `Token ${apiKey}`,
              }
            });
            if (pollRes.ok) {
              completedPrediction = await pollRes.json();
            }
            attempts++;
          }

          if (completedPrediction.status === "succeeded") {
            return completedPrediction;
          } else {
            throw new Error(completedPrediction.error || "Replicate prediction failed or timed out.");
          }
        } else {
          throw new Error(`Unknown provider: ${settingsProvider}`);
        }
      } catch (error: any) {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return executeWithRetry(attempt + 1);
        } else {
          throw error;
        }
      }
    };

    try {
      const data = await executeWithRetry();

      setGenerationStatus("Processing outputs...");

      if (settingsProvider === "openai") {
        const newImages = await Promise.all(
          data.data.map(async (img: any, i: number) => {
            const id = Date.now() + i;
            let imgUrl = img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url;

            if (img.url && !img.b64_json) {
              imgUrl = await convertUrlToBase64(img.url);
            }

            return {
              id,
              url: imgUrl,
              prompt: prompt,
              date: new Date().toISOString().split("T")[0],
              size: selectedSize === "custom" ? `${customWidth}×${customHeight}` : selectedSize.replace("x", "×"),
              model: settingsModel,
              favorite: false,
            };
          })
        );

        setGeneratedImages((prev) => [...newImages, ...prev]);
        saveGenerationsToLocalStorage(newImages);
      } else if (settingsProvider === "stability") {
        const newImages = [{
          id: Date.now(),
          url: `data:image/webp;base64,${data.image}`,
          prompt: prompt,
          date: new Date().toISOString().split("T")[0],
          size: selectedSize === "custom" ? `${customWidth}×${customHeight}` : selectedSize.replace("x", "×"),
          model: settingsModel,
          favorite: false,
        }];

        setGeneratedImages((prev) => [...newImages, ...prev]);
        saveGenerationsToLocalStorage(newImages);
      } else if (settingsProvider === "replicate") {
        const outputUrls = Array.isArray(data.output) 
          ? data.output 
          : [data.output];
        
        const newImages = await Promise.all(
          outputUrls.map(async (url: string, i: number) => {
            const base64Url = await convertUrlToBase64(url);
            return {
              id: Date.now() + i,
              url: base64Url,
              prompt: prompt,
              date: new Date().toISOString().split("T")[0],
              size: selectedSize === "custom" ? `${customWidth}×${customHeight}` : selectedSize.replace("x", "×"),
              model: settingsModel,
              favorite: false,
            };
          })
        );

        setGeneratedImages((prev) => [...newImages, ...prev]);
        saveGenerationsToLocalStorage(newImages);
      }
    } catch (error: any) {
      console.error("Failed to generate image after retries:", error);
      setErrorMessage(error.message || "An unexpected error occurred during generation.");
      setShowErrorModal(true);
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  const generateLabel =
    batchCount > 1 ? `Generate ${batchCount} images` : "Generate";

  const [plateWidth, plateHeight] = (() => {
    if (selectedSize === "custom") {
      return [Number(customWidth) || 1024, Number(customHeight) || 1024];
    }
    const [w, h] = selectedSize.split("x").map(Number);
    return [w || 1024, h || 1024];
  })();
  const plateScale = plateWidth / plateHeight;
  const plateRatioLabel =
    (selectedSize !== "custom" &&
      sizePresets.find((p) => p.value === selectedSize)?.ratio) ||
    ratioLabel(plateWidth, plateHeight);

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-paper">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rule px-4 md:px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="font-display text-base font-semibold text-ink">
              Studio
            </h1>
            <span className="truncate font-mono text-xs text-neutral">
              {providerNames[provider] ?? provider} · {selectedModel}
            </span>
          </div>
          <nav className="hidden shrink-0 items-center gap-4 sm:flex">
            <button className="text-xs font-medium text-muted hover:text-ink ui-transition">
              History
            </button>
            <button className="text-xs font-medium text-muted hover:text-ink ui-transition">
              Templates
            </button>
          </nav>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
          {/* Left panel — prompt & controls */}
          <div className="flex w-full flex-col border-b border-rule lg:w-[380px] lg:min-h-0 lg:border-b-0 lg:border-r xl:w-[412px]">
            <div className="flex-1 px-4 py-5 md:px-6 lg:min-h-0 lg:overflow-y-auto">
              {/* Prompt area */}
              <div className="border-b border-rule pb-5">
                <div className="mb-2 flex h-5 items-center justify-between">
                  <label
                    htmlFor="prompt"
                    className="text-xs font-medium text-muted"
                  >
                    Prompt
                  </label>
                  <kbd className="rounded border border-rule bg-paper-3 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-neutral">
                    ⌥P
                  </kbd>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden rounded-lg border bg-paper-2 ui-transition focus-within:border-accent ${
                    isDragging ? "border-accent" : "border-rule"
                  }`}
                >
                  <textarea
                    id="prompt"
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A brass lamp on a dark green wall, late afternoon light"
                    className="block w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-neutral"
                    style={{ minHeight: "120px" }}
                  />

                  {/* Reference images */}
                  {supportsImageInput && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-rule px-3 py-2">
                      {referenceImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative h-10 w-10 overflow-hidden rounded-md border border-rule"
                        >
                          <img
                            src={img.url}
                            alt={`Reference ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveReferenceImage(idx)}
                            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded bg-paper/90 text-muted opacity-0 hover:text-ink ui-transition-fast group-hover:opacity-100 focus-visible:opacity-100"
                            aria-label="Remove reference image"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add reference */}
                      <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-dashed border-rule-2 text-neutral hover:border-neutral hover:text-ink-2 focus-within:border-accent ui-transition">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span className="sr-only">Add reference image</span>
                      </label>
                      <span className="font-mono text-[11px] text-neutral">
                        Add reference
                      </span>
                    </div>
                  )}

                  {/* Drag overlay */}
                  {isDragging && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-lg border border-accent bg-paper/85">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-ink-2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-xs font-medium text-ink">
                        Drop to add reference
                      </span>
                    </div>
                  )}
                </div>

                {/* Negative prompt toggle */}
                <button
                  onClick={() => setShowNegative(!showNegative)}
                  aria-expanded={showNegative}
                  className="mt-3 flex h-8 items-center gap-1.5 text-xs text-muted hover:text-ink ui-transition"
                >
                  <Chevron open={showNegative} />
                  Negative prompt
                </button>

                <AnimatePresence>
                  {showNegative && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="Blur, text, extra fingers"
                        className="mt-2 h-9 w-full rounded-md border border-rule bg-paper-2 px-3 text-sm text-ink outline-none placeholder:text-neutral ui-transition focus-visible:border-accent"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Parameters */}
              <div className="pt-1">
                {/* Canvas */}
                <Section label="Canvas">
                  <div className="grid grid-cols-3 gap-2">
                    {sizePresets.map((preset) => {
                      const active = selectedSize === preset.value;
                      return (
                        <button
                          key={preset.value}
                          onClick={() => setSelectedSize(preset.value)}
                          aria-pressed={active}
                          className={`relative flex h-[60px] flex-col items-center justify-center gap-1 rounded-md border px-2 ui-transition ${
                            active
                              ? "border-rule-2 bg-paper-3 text-ink"
                              : "border-rule bg-paper-2 text-muted hover:border-rule-2 hover:bg-paper-3/60 hover:text-ink-2"
                          }`}
                        >
                          {active && (
                            <span className="absolute right-2 top-2 h-1 w-1 rounded-full bg-accent" />
                          )}
                          <span className="text-xs font-medium">
                            {preset.label}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-neutral">
                            {preset.ratio}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom size */}
                  <AnimatePresence>
                    {selectedSize === "custom" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="grid grid-cols-2 gap-2 overflow-hidden"
                      >
                        <div>
                          <label
                            htmlFor="canvas-width"
                            className="mb-1.5 block text-[11px] text-muted"
                          >
                            Width
                          </label>
                          <input
                            id="canvas-width"
                            type="number"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(e.target.value)}
                            min={256}
                            max={4096}
                            className="h-9 w-full rounded-md border border-rule bg-paper-2 px-3 font-mono text-sm tabular-nums text-ink outline-none ui-transition focus-visible:border-accent"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="canvas-height"
                            className="mb-1.5 block text-[11px] text-muted"
                          >
                            Height
                          </label>
                          <input
                            id="canvas-height"
                            type="number"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(e.target.value)}
                            min={256}
                            max={4096}
                            className="h-9 w-full rounded-md border border-rule bg-paper-2 px-3 font-mono text-sm tabular-nums text-ink outline-none ui-transition focus-visible:border-accent"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Section>

                {/* Quality */}
                <Section label="Quality">
                  <div className="space-y-1">
                    {qualityOptions.map((q) => {
                      const active = selectedQuality === q.value;
                      return (
                        <button
                          key={q.value}
                          onClick={() => setSelectedQuality(q.value)}
                          aria-pressed={active}
                          className={`flex h-9 w-full items-center gap-2 rounded-md border px-3 ui-transition ${
                            active
                              ? "border-rule-2 bg-paper-3"
                              : "border-rule bg-paper-2 hover:border-rule-2 hover:bg-paper-3/60"
                          }`}
                        >
                          <span className="flex w-2 shrink-0 justify-center">
                            {active && (
                              <span className="h-1 w-1 rounded-full bg-accent" />
                            )}
                          </span>
                          <span
                            className={`text-[13px] ${
                              active ? "text-ink" : "text-muted"
                            }`}
                          >
                            {q.label}
                          </span>
                          <span className="ml-auto truncate font-mono text-[11px] text-neutral">
                            {q.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Style */}
                <Section label="Style">
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.map((style) => {
                      const active = selectedStyle === style.value;
                      return (
                        <button
                          key={style.value}
                          onClick={() => setSelectedStyle(style.value)}
                          aria-pressed={active}
                          className={`flex h-8 items-center gap-2 rounded-md border px-3 text-xs ui-transition ${
                            active
                              ? "border-rule-2 bg-paper-3 text-ink"
                              : "border-rule bg-paper-2 text-muted hover:border-rule-2 hover:bg-paper-3/60 hover:text-ink-2"
                          }`}
                        >
                          {active && (
                            <span className="h-1 w-1 rounded-full bg-accent" />
                          )}
                          {style.label}
                        </button>
                      );
                    })}
                  </div>
                </Section>

                {/* Background (GPT-image-2 only) */}
                {isGptImage2 && (
                  <Section label="Background">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {["auto", "opaque"].map((bg) => {
                          const active = gptImage2Background === bg;
                          return (
                            <button
                              key={bg}
                              onClick={() => setGptImage2Background(bg)}
                              aria-pressed={active}
                              className={`flex h-9 items-center justify-center gap-2 rounded-md border text-xs ui-transition ${
                                active
                                  ? "border-rule-2 bg-paper-3 text-ink"
                                  : "border-rule bg-paper-2 text-muted hover:border-rule-2 hover:bg-paper-3/60 hover:text-ink-2"
                              }`}
                            >
                              {active && (
                                <span className="h-1 w-1 rounded-full bg-accent" />
                              )}
                              {bg === "auto" ? "Auto" : "Opaque"}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] leading-4 text-neutral">
                        GPT-image-2 renders opaque images only
                      </p>
                    </div>
                  </Section>
                )}

                {/* Output */}
                <Section label="Output" defaultOpen={false}>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="output-format"
                        className="mb-1.5 block text-[11px] text-muted"
                      >
                        Format
                      </label>
                      <select
                        id="output-format"
                        className="h-9 w-full rounded-md border border-rule bg-paper-2 px-2 text-sm text-ink outline-none ui-transition focus-visible:border-accent"
                      >
                        <option>PNG</option>
                        <option>JPEG</option>
                        <option>WebP</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="output-seed"
                        className="mb-1.5 block text-[11px] text-muted"
                      >
                        Seed
                      </label>
                      <input
                        id="output-seed"
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="Random"
                        className="h-9 w-full rounded-md border border-rule bg-paper-2 px-3 font-mono text-sm tabular-nums text-ink outline-none placeholder:text-neutral ui-transition focus-visible:border-accent"
                      />
                    </div>
                  </div>
                  {/* Batch count */}
                  <div>
                    <div className="mb-2 flex h-5 items-center justify-between">
                      <label htmlFor="batch-count" className="text-[11px] text-muted">
                        Batch
                      </label>
                      <span className="font-mono text-[11px] tabular-nums text-neutral">
                        {batchCount}
                      </span>
                    </div>
                    <input
                      id="batch-count"
                      ref={batchSliderRef}
                      type="range"
                      min="1"
                      max={isGptImage2 ? "10" : "8"}
                      value={batchCount}
                      onChange={(e) => setBatchCount(Number(e.target.value))}
                      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-rule-2 accent-accent"
                    />
                  </div>
                </Section>
              </div>
            </div>

            {/* Generate — pinned under the controls */}
            <div className="sticky bottom-0 z-10 border-t border-rule bg-paper px-4 py-4 md:px-6 lg:static">
              <motion.button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                whileTap={
                  !prompt.trim() || isGenerating ? undefined : { scale: 0.98 }
                }
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium ui-transition ${
                  !prompt.trim() || isGenerating
                    ? "cursor-not-allowed border-rule bg-paper-2 text-neutral"
                    : "border-transparent bg-accent text-accent-ink hover:bg-accent-hover"
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {generationStatus || "Generating…"}
                  </span>
                ) : (
                  <>
                    {generateLabel}
                    <span className="rounded border border-accent-ink/25 px-1.5 py-0.5 font-mono text-[11px] leading-4 opacity-70">
                      ⌘↵
                    </span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Output — the canvas plate */}
          <div className="flex min-w-0 flex-1 flex-col">
            {generatedImages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:py-10">
                {/* Plate for the current canvas preset */}
                <div
                  className="relative w-full"
                  style={{
                    width: `min(100%, calc(min(50vh, 480px) * ${plateScale}))`,
                  }}
                >
                  <CropMarks />
                  <div
                    className="rounded-xl border border-rule bg-paper-2 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                    style={{ aspectRatio: `${plateWidth} / ${plateHeight}` }}
                  >
                    <span
                      className="block h-full w-full rounded-[12px] border border-rule/60"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Gauge */}
                <div className="mt-4 flex items-center gap-2 font-mono text-xs tabular-nums text-neutral">
                  <span>
                    {plateWidth} × {plateHeight}
                  </span>
                  <span className="text-rule-2">/</span>
                  <span>{plateRatioLabel}</span>
                </div>

                <div className="mt-10 flex max-w-[320px] flex-col items-center text-center">
                  <h2 className="font-display text-2xl font-semibold text-ink">
                    Nothing developed yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Write a prompt and Frame renders it on this canvas
                  </p>
                  <button
                    onClick={() => textareaRef.current?.focus()}
                    className="mt-5 flex h-9 items-center gap-2 rounded-md border border-rule bg-paper-2 px-3 text-xs font-medium text-ink-2 hover:border-rule-2 hover:bg-paper-3 ui-transition"
                  >
                    Write a prompt
                    <kbd className="rounded border border-rule bg-paper-3 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-neutral">
                      ⌥P
                    </kbd>
                  </button>
                </div>
              </div>
            ) : (
              /* Contact sheet */
              <div className="flex-1 px-4 py-5 md:px-6 lg:min-h-0 lg:overflow-y-auto">
                <motion.div
                  className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {generatedImages.map((img) => (
                    <motion.figure
                      key={img.id}
                      variants={fadeItem}
                      className="group overflow-hidden rounded-lg border border-rule bg-paper-2 ui-transition hover:border-rule-2"
                    >
                      <div className="relative aspect-square">
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute right-2 top-2 flex gap-1 opacity-100 focus-within:opacity-100 ui-transition lg:opacity-0 lg:group-hover:opacity-100">
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-rule-2 bg-paper/90 text-ink-2 hover:bg-paper-3 hover:text-ink ui-transition-fast"
                            aria-label="Edit image"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-rule-2 bg-paper/90 text-ink-2 hover:bg-paper-3 hover:text-ink ui-transition-fast"
                            aria-label="Download image"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <figcaption className="border-t border-rule px-3 py-2">
                        <p className="truncate text-xs leading-5 text-ink-2">
                          {img.prompt}
                        </p>
                        <p className="mt-1 truncate font-mono text-[11px] leading-4 tabular-nums text-neutral">
                          {img.size.replace("×", " × ")} · {img.model}
                        </p>
                      </figcaption>
                    </motion.figure>
                  ))}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Error dialog */}
      <AnimatePresence>
        {showErrorModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              onClick={() => setShowErrorModal(false)}
              className="absolute inset-0 bg-paper/80 backdrop-blur-sm"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease }}
              className="relative z-10 w-full max-w-md rounded-xl border border-rule bg-paper-2 p-6 shadow-2xl"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="generation-error-title"
            >
              {/* Header */}
              <div className="mb-4 flex items-center gap-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-error"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2
                  id="generation-error-title"
                  className="font-display text-base font-semibold text-ink"
                >
                  Generation failed
                </h2>
              </div>

              {/* Message */}
              <div className="mb-5 select-text break-words rounded-lg border border-rule bg-paper-3 p-3 font-mono text-xs leading-5 text-muted">
                {errorMessage}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="h-9 rounded-md border border-rule bg-paper-2 px-3 text-xs font-medium text-muted hover:border-rule-2 hover:text-ink ui-transition"
                >
                  Close
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowErrorModal(false);
                    handleGenerate();
                  }}
                  className="h-9 rounded-md bg-accent px-3 text-xs font-medium text-accent-ink hover:bg-accent-hover ui-transition"
                >
                  Retry
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
