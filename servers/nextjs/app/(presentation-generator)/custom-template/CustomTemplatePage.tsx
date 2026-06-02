"use client";



import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, RefreshCw, Wrench, X } from "lucide-react";



import { useFileUpload } from "./hooks/useFileUpload";
import { useTemplateCreation } from "./hooks/useTemplateCreation";
import { useLayoutSaving } from "./hooks/useLayoutSaving";

import { ProcessedSlide } from "./types";
import { TAILWIND_CDN_URL } from "./constants";
import { TemplateStudioHeader } from "./components/TemplateStudioHeader";
import { TemplateCreationProgress } from "./components/TemplateCreationProgress";
import { Step2FontManagement } from "./components/steps/Step2FontManagement";
import { Step3SlidePreview } from "./components/steps/Step3SlidePreview";
import { Step4TemplateCreation } from "./components/steps/Step4TemplateCreation";
import { SaveLayoutButton } from "./components/SaveLayoutButton";
import { SaveLayoutModal } from "./components/SaveLayoutModal";
import { FileUploadSection } from "./components/FileUploadSection";

import { useFontLoader } from "../hooks/useFontLoad";
import Header from "@/app/(presentation-generator)/(dashboard)/dashboard/components/Header";

type LibreOfficeGateState = "checking" | "ready" | "missing" | "installing" | "error";

const LibreOfficeGate = ({
    status,
    message,
    progress,
    onInstall,
    onCancel,
    onRecheck,
    onExit,
}: {
    status: LibreOfficeGateState;
    message: string;
    progress?: number;
    onInstall: () => void;
    onCancel: () => void;
    onRecheck: () => void;
    onExit: () => void;
}) => {
    if (status === "ready") return null;

    const isChecking = status === "checking";
    const isInstalling = status === "installing";
    const isBusy = isChecking || isInstalling;
    const percent = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : undefined;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101323]/30 px-4 backdrop-blur-[5px]">
            <div className="relative w-full max-w-[460px] rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-2xl">
                <button
                    type="button"
                    onClick={isInstalling ? onCancel : onExit}
                    className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#101323]"
                    aria-label={isInstalling ? "Cancel LibreOffice installation" : "Go back"}
                    title={isInstalling ? "Cancel install" : "Go back"}
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EBE9FE] text-[#6D5BD0]">
                        {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wrench className="h-5 w-5" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[#101323]">Install LibreOffice to continue</h2>
                        <p className="mt-1 text-sm leading-6 text-[#5D6375]">
                            Template Studio uses LibreOffice to convert uploaded PPTX files before generating reusable templates.
                        </p>
                    </div>
                </div>

                <div className="mt-5 rounded-lg border border-[#EEF0F4] bg-[#FAFAFF] px-4 py-3 text-sm text-[#3A4054]">
                    {message}
                </div>

                {isInstalling && (
                    <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-[#EDEEF5]">
                            <div
                                className={`h-full rounded-full bg-[#6D5BD0] transition-all ${percent === undefined ? "w-1/2 animate-pulse" : ""}`}
                                style={percent === undefined ? undefined : { width: `${percent}%` }}
                            />
                        </div>
                    </div>
                )}

                {isInstalling ? (
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            disabled
                            className="inline-flex h-11 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#B8BDCB] px-4 text-sm font-semibold text-white"
                        >
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Installing...
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D9DCE7] px-4 text-sm font-semibold text-[#101323] transition hover:bg-[#F6F7FB]"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={onInstall}
                            disabled={isChecking}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#101323] px-4 text-sm font-semibold text-white transition hover:bg-[#252A3F] disabled:cursor-not-allowed disabled:bg-[#B8BDCB] sm:col-span-2"
                        >
                            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Install LibreOffice
                        </button>
                        <button
                            type="button"
                            onClick={onRecheck}
                            disabled={isChecking}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D9DCE7] px-4 text-sm font-semibold text-[#101323] transition hover:bg-[#F6F7FB] disabled:cursor-not-allowed disabled:text-[#9AA1B5]"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Recheck
                        </button>
                        <button
                            type="button"
                            onClick={onExit}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D9DCE7] px-4 text-sm font-semibold text-[#101323] transition hover:bg-[#F6F7FB]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Go back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};




const CustomTemplatePage = () => {
    const router = useRouter();

    const [schemaEditorSlideIndex, setSchemaEditorSlideIndex] = useState<number | null>(null);
    const [schemaPreviewData, setSchemaPreviewData] = useState<Record<number, Record<string, any>>>({});
    const [libreStatus, setLibreStatus] = useState<LibreOfficeGateState>("checking");
    const [libreMessage, setLibreMessage] = useState("Checking LibreOffice availability...");
    const [libreProgress, setLibreProgress] = useState<number | undefined>();

    const { selectedFile, handleFileSelect, removeFile } = useFileUpload();


    const {
        state,
        uploadedFonts,
        slides,
        setSlides,
        completedSlides,
        checkFonts,
        uploadFont,
        removeFont,
        fontUploadAndPreview,
        initTemplateCreation,
        retrySlide,
    } = useTemplateCreation();

    // Layout saving hook
    const {
        isSavingLayout,
        isModalOpen,
        openSaveModal,
        closeSaveModal,
        saveLayout,
    } = useLayoutSaving(slides);


    useEffect(() => {
        const existingScript = document.querySelector('script[src*="tailwindcss.com"]');
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = TAILWIND_CDN_URL;
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    const checkLibreOffice = useCallback(async () => {
        const api = window.electron;
        if (!api?.checkLibreOffice) {
            setLibreStatus("ready");
            return;
        }

        setLibreStatus("checking");
        setLibreMessage("Checking LibreOffice availability...");
        try {
            const result = await api.checkLibreOffice();
            if (result.installed) {
                setLibreStatus("ready");
                setLibreMessage("LibreOffice is ready.");
            } else {
                setLibreStatus("missing");
                setLibreMessage("LibreOffice is not installed yet. Install it to use Template Studio.");
            }
        } catch (error) {
            setLibreStatus("error");
            setLibreMessage(error instanceof Error ? error.message : "Could not check LibreOffice.");
        }
    }, []);

    useEffect(() => {
        void checkLibreOffice();
    }, [checkLibreOffice]);

    useEffect(() => {
        const api = window.electron;
        if (!api?.onLibreOfficeProgress || !api?.onLibreOfficeLog) {
            return;
        }

        const offProgress = api.onLibreOfficeProgress((payload) => {
            if (payload.phase === "downloading" || payload.phase === "installing") {
                setLibreStatus("installing");
                setLibreProgress(payload.percent);
                if (payload.message) {
                    setLibreMessage(payload.message.split("|").filter(Boolean).join(" - "));
                }
            } else if (payload.phase === "done") {
                setLibreProgress(100);
                setLibreMessage("LibreOffice is ready.");
                void checkLibreOffice();
            } else if (payload.phase === "error") {
                if (payload.message?.toLowerCase().includes("cancelled")) {
                    setLibreStatus("missing");
                    setLibreProgress(undefined);
                    setLibreMessage("LibreOffice installation cancelled. You can install it later to use Template Studio.");
                    return;
                }
                setLibreStatus("error");
                setLibreMessage(payload.message || "LibreOffice installation failed.");
            }
        });
        const offLog = api.onLibreOfficeLog((payload) => {
            if (payload.level === "error" && payload.text) {
                setLibreMessage(payload.text);
            }
        });

        return () => {
            offProgress();
            offLog();
        };
    }, [checkLibreOffice]);

    const installLibreOffice = useCallback(async () => {
        const api = window.electron;
        if (!api?.installLibreOffice) {
            setLibreStatus("error");
            setLibreMessage("LibreOffice installer is unavailable in this build.");
            return;
        }

        setLibreStatus("installing");
        setLibreProgress(undefined);
        setLibreMessage("Preparing LibreOffice installer...");
        try {
            const result = await api.installLibreOffice();
            if (result?.ok) {
                await checkLibreOffice();
                return;
            }
            if (result?.cancelled) {
                setLibreStatus("missing");
                setLibreProgress(undefined);
                setLibreMessage("LibreOffice installation cancelled. You can install it later to use Template Studio.");
                return;
            }
            setLibreStatus("error");
            setLibreMessage(result?.error || "LibreOffice installation failed.");
        } catch (error) {
            setLibreStatus("error");
            setLibreMessage(error instanceof Error ? error.message : "LibreOffice installation failed.");
        }
    }, [checkLibreOffice]);

    const cancelLibreOfficeInstall = useCallback(async () => {
        const api = window.electron;
        setLibreMessage("Cancelling LibreOffice installation...");
        try {
            await api?.cancelLibreOfficeInstall?.();
        } finally {
            setLibreStatus("missing");
            setLibreProgress(undefined);
            setLibreMessage("LibreOffice installation cancelled. You can install it later to use Template Studio.");
        }
    }, []);

    const leaveTemplateStudio = useCallback(() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }
        router.push("/templates");
    }, [router]);


    /**
     * Step 1: Check fonts in uploaded PPTX
     */
    const handleCheckFonts = useCallback(async () => {


        if (selectedFile) {
            await checkFonts(selectedFile);
        }
    }, [selectedFile, checkFonts]);

    /**
     * Step 2: Upload fonts and generate preview
     */
    const handleFontUploadAndPreview = useCallback(async () => {
        if (selectedFile) {
            const data = await fontUploadAndPreview(selectedFile);
            if (data) {
                useFontLoader(data.fonts);
            }
        }
    }, [selectedFile, fontUploadAndPreview]);

    /**
     * Step 5: Save template with metadata
     */
    const handleSaveTemplate = useCallback(async (
        layoutName: string,
        description: string,
        template_info_id: string
    ): Promise<string | null> => {
        const id = await saveLayout(layoutName, description, template_info_id);
        if (id) {
            router.push(`/template-preview?slug=custom-${id}`);
        }
        return id;
    }, [saveLayout, router]);

    /**
     * Update a specific slide's data
     */
    const handleSlideUpdate = useCallback((index: number, updatedSlideData: Partial<ProcessedSlide>) => {
        setSlides((prevSlides) =>
            prevSlides.map((s, i) =>
                i === index
                    ? { ...s, ...updatedSlideData, modified: true }
                    : s
            )
        );
    }, [setSlides]);


    /**
     * Open schema editor for a specific slide
     */
    const handleOpenSchemaEditor = useCallback((index: number | null) => {
        setSchemaEditorSlideIndex(index);
    }, []);

    /**
     * Close schema editor
     */
    const handleCloseSchemaEditor = useCallback(() => {
        setSchemaEditorSlideIndex(null);
    }, []);

    /**
     * Save changes from schema editor
     */
    const handleSchemaEditorSave = useCallback((updatedReact: string) => {
        if (schemaEditorSlideIndex !== null) {
            setSlides(prev => prev.map((s, i) =>
                i === schemaEditorSlideIndex ? { ...s, react: updatedReact } : s
            ));
        }
        setSchemaEditorSlideIndex(null);
    }, [schemaEditorSlideIndex, setSlides]);

    /**
     * Update schema preview content (for AI fill)
     */
    const handleSchemaPreviewContent = useCallback((content: Record<string, any>) => {
        if (schemaEditorSlideIndex !== null) {
            setSchemaPreviewData(prev => ({
                ...prev,
                [schemaEditorSlideIndex]: content
            }));
        }
    }, [schemaEditorSlideIndex]);

    /**
     * Clear schema preview data for a specific slide
     */
    const handleClearSchemaPreview = useCallback((slideIndex: number) => {
        setSchemaPreviewData(prev => {
            const newData = { ...prev };
            delete newData[slideIndex];
            return newData;
        });
    }, []);



    const showFileUpload = state.step === 'file-upload';
    const showFontManager = state.step === 'font-check' || state.step === 'font-upload';
    const showPreview = state.step === 'slides-preview';
    const showSlides = state.step === 'template-creation' || state.step === 'completed';
    const isProcessingCompleted = state.step === 'completed';



    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

            <div className={libreStatus === "ready" ? "" : "pointer-events-none select-none blur-[3px]"}>
                <Header />
                <TemplateStudioHeader />
                {showFileUpload ? (
                    <div className="pb-24">
                        <FileUploadSection
                            selectedFile={selectedFile}
                            handleFileSelect={handleFileSelect}
                            removeFile={removeFile}
                            CheckFonts={handleCheckFonts}
                            isProcessingPptx={state.isLoading}
                            slides={[]}
                            completedSlides={0}
                        />

                    </div>
                ) : (
                    <div className="mx-auto min-h-[600px] px-6 pb-24">

                    <TemplateCreationProgress
                        currentStep={state.step}
                        totalSlides={state.totalSlides}
                        processedSlides={completedSlides}
                    />

                    {/* Step 2: Font Management */}
                    {showFontManager && (
                        <Step2FontManagement
                            fontsData={state.fontsData}
                            uploadedFonts={uploadedFonts}
                            uploadFont={uploadFont}
                            removeFont={removeFont}
                            onContinue={handleFontUploadAndPreview}
                            isUploading={state.isLoading}
                        />
                    )}

                    {/* Step 3: Slide Preview */}
                    {showPreview && (
                        <Step3SlidePreview
                            previewData={state.previewData}
                            onInitTemplate={initTemplateCreation}
                            isLoading={state.isLoading}
                        />
                    )}

                    {/* Step 4: Template Creation & Editing */}
                    {showSlides && slides.length > 0 && (
                        <Step4TemplateCreation
                            slides={slides}
                            setSlides={setSlides}
                            retrySlide={retrySlide}
                            onSlideUpdate={handleSlideUpdate}
                            schemaEditorSlideIndex={schemaEditorSlideIndex}
                            onOpenSchemaEditor={handleOpenSchemaEditor}
                            onCloseSchemaEditor={handleCloseSchemaEditor}
                            onSchemaEditorSave={handleSchemaEditorSave}
                            schemaPreviewData={schemaPreviewData}
                            onSchemaPreviewContent={handleSchemaPreviewContent}
                            onClearSchemaPreview={handleClearSchemaPreview}
                        />
                    )}

                    {/* Floating Save Template Button */}
                    {isProcessingCompleted && slides.some((s) => s.processed) && (
                        <SaveLayoutButton
                            onSave={openSaveModal}
                            isSaving={isSavingLayout}
                            isProcessing={slides.some((s) => s.processing)}
                        />
                    )}

                    {/* Save Template Modal */}
                    <SaveLayoutModal
                        isOpen={isModalOpen}
                        onClose={closeSaveModal}
                        onSave={handleSaveTemplate}
                        isSaving={isSavingLayout}
                        template_info_id={state.templateId || ''}
                    />
                    </div>
                )}
            </div>
            <LibreOfficeGate
                status={libreStatus}
                message={libreMessage}
                progress={libreProgress}
                onInstall={installLibreOffice}
                onCancel={cancelLibreOfficeInstall}
                onRecheck={checkLibreOffice}
                onExit={leaveTemplateStudio}
            />

        </div>
    );
};

export default CustomTemplatePage;
