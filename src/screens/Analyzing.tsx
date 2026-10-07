import type { AdNotice } from "../App";
import type { AnalysisSource } from "../types";

interface AnalyzingProps {
  imageUri: string;
  sourceType: AnalysisSource["type"];
  adNotice: AdNotice;
}

const COPY: Record<AnalysisSource["type"], { title: string; desc: string }> = {
  image: { title: "AI가 냉장고를 분석하고 있어요", desc: "재료를 인식하고 딱 맞는 레시피를 찾는 중이에요." },
  text: { title: "재료에 맞는 레시피를 찾고 있어요", desc: "알려주신 재료로 만들 수 있는 메뉴를 고르는 중이에요." },
  today: { title: "오늘의 메뉴를 고르고 있어요", desc: "오늘 먹기 좋은 메뉴를 찾는 중이에요." },
};

export function Analyzing({ imageUri, sourceType, adNotice }: AnalyzingProps) {
  const copy = COPY[sourceType];
  return (
    <div className="screen screen-center">
      <div className="analyzing-image-wrap">
        {/* 사진 없이 시작한 경우(직접 입력·오늘의 메뉴) 빈 src 로 깨진 이미지가 뜨지 않게 해요. */}
        {imageUri ? (
          <img src={imageUri} alt="촬영한 냉장고 사진" className="analyzing-image" />
        ) : (
          <div className="analyzing-image analyzing-placeholder">🍳</div>
        )}
        <div className="analyzing-spinner" />
      </div>
      <p className="analyzing-title">{copy.title}</p>
      <p className="analyzing-desc">
        {copy.desc}
        {"\n"}잠시만 기다려주세요.
      </p>
      {adNotice === "after" && (
        <p className="analyzing-ad-notice">분석이 끝나면 짧은 광고를 본 뒤{"\n"}추천 레시피를 보여드려요.</p>
      )}
      {adNotice === "soon" && (
        <p className="analyzing-ad-notice analyzing-ad-notice-soon">
          분석 완료! 곧 광고가 재생돼요.{"\n"}광고가 끝나면 레시피를 보여드려요.
        </p>
      )}
    </div>
  );
}
