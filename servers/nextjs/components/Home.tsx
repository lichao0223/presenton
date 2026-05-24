"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { handleSaveLLMConfig } from "@/utils/storeHelpers";
import {
  checkIfSelectedOllamaModelIsPulled,
  pullOllamaModel,
} from "@/utils/providerUtils";
import { LLMConfig } from "@/types/llm_config";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { usePathname } from "next/navigation";
import OnBoardingSlidebar from "./OnBoarding/OnBoardingSlidebar";
import OnBoardingHeader from "./OnBoarding/OnBoardingHeader";
import ModeSelectStep from "./OnBoarding/ModeSelectStep";
import PresentonMode from "./OnBoarding/PresentonMode";
import GenerationWithImage from "./OnBoarding/GenerationWithImage";
import FinalStep from "./OnBoarding/FinalStep";

// Button state interface
interface ButtonState {
  isLoading: boolean;
  isDisabled: boolean;
  text: string;
  showProgress: boolean;
  progressPercentage?: number;
  status?: string;
}



export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1)
  const [selectedMode, setSelectedMode] = useState<string>("presenton")
  const config = useSelector((state: RootState) => state.userConfig);

  const canChangeKeys = config.can_change_keys;


  useEffect(() => {
    if (!canChangeKeys) {
      router.push("/upload");
    }
  }, [canChangeKeys, router]);

  if (!canChangeKeys) {
    return null;
  }

  return (

    <div className="flex min-h-screen relative">
      <OnBoardingSlidebar step={step} />
      <main className="w-full pl-20 pr-8 max-w-[1440px] mx-auto relative z-10">

        <OnBoardingHeader currentStep={step} setStep={setStep} />
        {step === 1 && <ModeSelectStep selectedMode={selectedMode} setStep={setStep} setSelectedMode={setSelectedMode} />}
        {step === 2 && selectedMode === "presenton" && <PresentonMode currentStep={step} setStep={setStep} />}
        {step === 2 && selectedMode === "image" && <GenerationWithImage />}
        {step === 3 && <FinalStep />}
      </main>
    </div>
  );
}
