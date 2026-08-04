import { Button, Top } from "@toss/tds-mobile";
import { fetchAlbumPhotos, openCamera } from "@apps-in-toss/web-framework";
import { BannerAd } from "../components/BannerAd";
import { IngredientChip } from "../components/IngredientChip";
import { PartnersDisclosure } from "../components/PartnersDisclosure";
import { RecipeCard } from "../components/RecipeCard";
import type { DemoSet } from "../demoData";

interface HomeProps {
  onImageSelected: (base64: string) => void;
  onError: (message: string) => void;
  onTryDemo: () => void;
  onManualInput: () => void;
  onTodayMenu: () => void;
  onViewHistory: () => void;
  onViewFavorites: () => void;
  hasHistory: boolean;
  hasFavorites: boolean;
  demoSet: DemoSet;
}

export function Home({
  onImageSelected,
  onError,
  onTryDemo,
  onManualInput,
  onTodayMenu,
  onViewHistory,
  onViewFavorites,
  hasHistory,
  hasFavorites,
  demoSet,
}: HomeProps) {
  const handleTakePhoto = async () => {
    try {
      const photo = await openCamera({ base64: true, maxWidth: 1024 });
      onImageSelected(photo.dataUri);
    } catch {
      onError("카메라를 사용할 수 없어요. 카메라 권한을 확인해주세요.");
    }
  };

  const handlePickAlbum = async () => {
    try {
      const photos = await fetchAlbumPhotos({ base64: true, maxWidth: 1024, maxCount: 1 });
      if (photos[0]) onImageSelected(photos[0].dataUri);
    } catch {
      onError("사진첩을 사용할 수 없어요. 사진첩 접근 권한을 확인해주세요.");
    }
  };

  return (
    <div className="screen">
      <Top
        title={
          <Top.TitleParagraph size={22}>
            냉장고 문을 열고,{"\n"}사진 한 장만 찍어보세요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph size={17}>
            AI가 재료를 인식해서 지금 있는 재료로{"\n"}만들 수 있는 메뉴를 추천해드려요.
          </Top.SubtitleParagraph>
        }
      />

      <div className="example-preview" onClick={onTryDemo}>
        <div className="example-preview-header">
          <span className="example-badge">예시</span>
          <span className="example-preview-title">{demoSet.label}라면 이렇게 추천해드려요</span>
        </div>
        <div className="ingredient-list">
          {demoSet.result.ingredients.slice(0, 4).map((ingredient) => (
            <IngredientChip key={ingredient} label={ingredient} />
          ))}
        </div>
        <RecipeCard recipe={demoSet.result.recipes[0]} onClick={onTryDemo} />
        <span className="example-preview-cta">탭하고 샘플로 체험해보기 →</span>
      </div>

      <div className="home-actions">
        <Button variant="fill" display="full" size="xlarge" onClick={handleTakePhoto}>
          📷 냉장고 촬영하기
        </Button>
        <Button variant="weak" display="full" size="xlarge" onClick={handlePickAlbum}>
          🖼 앨범에서 사진 선택하기
        </Button>
        <Button variant="weak" display="full" size="xlarge" onClick={onManualInput}>
          ✏️ 재료 직접 입력하기
        </Button>
        <Button variant="weak" display="full" size="xlarge" onClick={onTodayMenu}>
          🍽 오늘 뭐 먹지 추천받기
        </Button>
      </div>

      <div className="home-links">
        {hasHistory && (
          <button type="button" className="home-history-link" onClick={onViewHistory}>
            📖 지난 촬영 기록 보기
          </button>
        )}
        {hasFavorites && (
          <button type="button" className="home-history-link" onClick={onViewFavorites}>
            ⭐ 즐겨찾기한 레시피 보기
          </button>
        )}
      </div>

      <div className="home-tips">
        <p className="home-tips-title">이런 분들께 추천해요</p>
        <ul>
          <li>냉장고 속 애매하게 남은 재료들을 처리하고 싶은 분</li>
          <li>매일 뭐 먹을지 정하는 게 스트레스인 분</li>
          <li>장보기 전에 집에 있는 재료부터 확인하고 싶은 분</li>
        </ul>
      </div>

      <BannerAd />
      <PartnersDisclosure />
    </div>
  );
}
