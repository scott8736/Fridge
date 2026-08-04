interface AnalyzingProps {
  imageUri: string;
}

export function Analyzing({ imageUri }: AnalyzingProps) {
  return (
    <div className="screen screen-center">
      <div className="analyzing-image-wrap">
        <img src={imageUri} alt="촬영한 냉장고 사진" className="analyzing-image" />
        <div className="analyzing-spinner" />
      </div>
      <p className="analyzing-title">AI가 냉장고를 분석하고 있어요</p>
      <p className="analyzing-desc">재료를 인식하고 딱 맞는 레시피를 찾는 중이에요.{"\n"}잠시만 기다려주세요.</p>
    </div>
  );
}
