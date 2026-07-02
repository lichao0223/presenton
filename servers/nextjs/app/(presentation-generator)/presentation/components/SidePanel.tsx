"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { setPresentationData } from "@/store/slices/presentationGeneration";
import { SortableSlide } from "./SortableSlide";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import NewSlide from "./NewSlide";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { SlideThumbnailCard } from "./SlideThumbnailCard";
import { useI18n } from "@/i18n/I18nProvider";

interface SidePanelProps {
  selectedSlide: number;
  onSlideClick: (index: number) => void;
  presentationId: string;
  loading: boolean;
  streamingTotalSlides?: number;
}

const SidePanel = ({
  selectedSlide,
  onSlideClick,
  presentationId,
  loading,
  streamingTotalSlides = 0,
}: SidePanelProps) => {
  const pathname = usePathname();
  const { t } = useI18n();
  const [showNewSlideSelection, setShowNewSlideSelection] = useState(false);

  const { presentationData, isStreaming } = useSelector(
    (state: RootState) => state.presentationGeneration
  );

  const dispatch = useDispatch();
  const slides = presentationData?.slides ?? [];
  const totalSlides = Math.max(
    streamingTotalSlides,
    presentationData?.n_slides ?? 0,
    slides.length
  );
  const shouldShowStreamingRail = Boolean(isStreaming && totalSlides > 0);
  const streamingSlidesByIndex = new Map<number, any>(
    slides.map((slide: any, fallbackIndex: number) => [
      slide.index ?? fallbackIndex,
      slide,
    ])
  );

  const lastSlideIndex = slides.length
    ? slides.length - 1
    : 0;
  const lastSlideTemplateId = slides?.[lastSlideIndex]?.layout
    ? slides[lastSlideIndex].layout.split(":")[0]
    : "";

  const handleAddSlideClick = () => {
    if (!slides.length || isStreaming) return;
    setShowNewSlideSelection(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after moving 8px
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!active || !over || !presentationData?.slides) return;

    if (active.id !== over.id) {
      // Find the indices of the dragged and target items
      const oldIndex = presentationData?.slides.findIndex(
        (item: any) => item.id === active.id
      );
      const newIndex = presentationData?.slides.findIndex(
        (item: any) => item.id === over.id
      );

      // Reorder the array
      const reorderedArray = arrayMove(
        presentationData?.slides,
        oldIndex,
        newIndex
      );

      // Update indices of all slides
      const updatedArray = reorderedArray.map((slide: any, index: number) => ({
        ...slide,
        index: index,
      }));

      // Update the store with new order and indices
      dispatch(
        setPresentationData({ ...presentationData, slides: updatedArray })
      );
      trackEvent(MixpanelEvent.Presentation_Slides_Reordered, {
        pathname,
        presentation_id: presentationId,
        from_index: oldIndex,
        to_index: newIndex,
        slide_count: updatedArray.length,
      });
    }
  };

  // Loading shimmer component
  if (
    (!presentationData && !shouldShowStreamingRail) ||
    (loading && !shouldShowStreamingRail) ||
    (!shouldShowStreamingRail && slides.length === 0)
  ) {
    return null;
  }

  const shouldShowNewSlideModal =
    showNewSlideSelection &&
    lastSlideTemplateId &&
    typeof document !== "undefined";

  const newSlideModal = shouldShowNewSlideModal
    ? createPortal(
        <div
          className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 px-4 py-16"
          onClick={() => setShowNewSlideSelection(false)}
        >
          <div className="relative z-[1001] flex min-h-full items-start justify-center pt-10">
            <div
              className="w-full max-w-[675px]"
              onClick={(event) => event.stopPropagation()}
            >
              <NewSlide
                index={lastSlideIndex}
                templateID={lastSlideTemplateId}
                setShowNewSlideSelection={setShowNewSlideSelection}
                presentationId={presentationId}
              />
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="px-4 w-[120px] h-full">
      <div
        className={`
          relative  h-full z-50 xl:z-auto 
          transition-all duration-300 ease-in-out
        `}
      >
        <div className="w-full h-full hide-scrollbar overflow-hidden slide-theme flex flex-col">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-y-auto w-full hide-scrollbar min-h-0 flex-1 space-y-3.5">
              {isStreaming ? (
                Array.from({ length: totalSlides }).map((_, index) => {
                  const slide = streamingSlidesByIndex.get(index);

                  if (slide) {
                    return (
                      <SlideThumbnailCard
                        key={`${slide.id ?? "streaming"}-${index}`}
                        slide={slide}
                        index={index}
                        selected={selectedSlide === index}
                        onClick={() => onSlideClick(slide.index ?? index)}
                      />
                    );
                  }

                  return (
                    <div
                      key={`streaming-placeholder-${index}`}
                      className="relative overflow-hidden rounded-[12px] border border-[#EDEEEF] bg-white p-1.5"
                    >
                      <p className="pointer-events-none absolute -left-1 top-1/2 z-50 flex h-[18px] min-w-[18px] -translate-y-1/2 items-center justify-center rounded-full border border-[#EDEEEF] bg-white px-1 text-[10px] font-medium text-[#191919] shadow-sm">
                        {index + 1}
                      </p>
                      <div
                        className="relative overflow-hidden rounded-[10px] bg-[#F4F5F6]"
                        style={{ height: `${720 * 0.061}px` }}
                      >
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#F4F5F6] via-white to-[#F4F5F6]" />
                        <div className="absolute left-3 top-3 h-2 w-8 rounded bg-[#D8DBDF]" />
                        <div className="absolute left-3 top-6 h-1.5 w-14 rounded bg-[#E1E3E6]" />
                        <div className="absolute bottom-3 right-3 h-6 w-8 rounded bg-[#D8DBDF]" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <SortableContext
                  items={
                    slides.map(
                      (slide: any) => slide.id || `${slide.index}`
                    ) || []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {slides.map((slide: any, index: number) => (
                    <SortableSlide
                      key={`${slide.id}-${index}`}
                      slide={slide}
                      index={index}
                      selectedSlide={selectedSlide}
                      onSlideClick={onSlideClick}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
          <Separator orientation="horizontal" className=" " />

          <button
            type="button"
            disabled={Boolean(isStreaming || !slides.length)}
            onClick={handleAddSlideClick}
            className="py-4 gap-2 flex flex-col duration-300 items-center justify-center rounded-lg cursor-pointer mx-auto disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] font-normal text-[#000000]">
              {t("Add Slide")}
            </span>
          </button>
        </div>
      </div>
      {newSlideModal}
    </div>
  );
};

export default SidePanel;
