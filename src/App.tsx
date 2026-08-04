import { useEffect, useState } from "react";
import "./App.css";
import { analyzeFridgeImage } from "./api";
import { AD_GROUP_IDS, INTERSTITIAL_SESSION_CAP } from "./adConfig";
import { pickRandomDemoSet } from "./demoData";
import { addHistoryEntry, loadHistory, type HistoryEntry } from "./history";
import { playFullScreenAd, preloadFullScreenAd } from "./hooks/useFullScreenAd";
import { Analyzing } from "./screens/Analyzing";
import { History } from "./screens/History";
import { Home } from "./screens/Home";
import { RecipeDetail } from "./screens/RecipeDetail";
import { Result } from "./screens/Result";
import type { AnalyzeResult, Recipe } from "./types";

type Page = "home" | "analyzing" | "result" | "recipeDetail" | "history";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [imageUri, setImageUri] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetailFrom, setRecipeDetailFrom] = useState<"result" | "history">("result");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);
  const [interstitialShownCount, setInterstitialShownCount] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // 방문마다 한 번만 랜덤으로 뽑아서, 홈 미리보기와 실제 체험 화면이 같은 세트를 보여주게 해요.
  const [demoSet] = useState(() => pickRandomDemoSet());

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const handleImageSelected = async (base64: string) => {
    setImageUri(`data:image/jpeg;base64,${base64}`);
    setImageBase64(base64);
    setIsDemo(false);
    setPage("analyzing");
    setErrorMessage("");

    // 세션당 노출 상한 안에 있을 때만, AI 분석과 동시에 미리 로드해서 대기시간을 겹쳐 써요.
    const willShowInterstitial = interstitialShownCount < INTERSTITIAL_SESSION_CAP;
    if (willShowInterstitial) preloadFullScreenAd(AD_GROUP_IDS.interstitial);

    try {
      const analyzeResult = await analyzeFridgeImage(base64);
      if (willShowInterstitial) {
        await playFullScreenAd(AD_GROUP_IDS.interstitial);
        setInterstitialShownCount((count) => count + 1);
      }
      setResult(analyzeResult);
      setPage("result");
      addHistoryEntry(analyzeResult).then(setHistory);
    } catch {
      setErrorMessage("냉장고 사진을 분석하지 못했어요. 다시 시도해주세요.");
      setPage("home");
    }
  };

  const handleTryDemo = () => {
    setIsDemo(true);
    setImageBase64("");
    setResult(demoSet.result);
    setErrorMessage("");
    setPage("result");
  };

  const handleRetake = () => {
    setResult(null);
    setImageUri("");
    setImageBase64("");
    setIsDemo(false);
    setPage("home");
  };

  if (page === "analyzing") {
    return <Analyzing imageUri={imageUri} />;
  }

  if (page === "result" && result) {
    return (
      <Result
        result={result}
        isDemo={isDemo}
        demoLabel={demoSet.label}
        imageBase64={isDemo ? undefined : imageBase64}
        onRetake={handleRetake}
        onSelectRecipe={(recipe) => {
          setSelectedRecipe(recipe);
          setRecipeDetailFrom("result");
          setPage("recipeDetail");
        }}
      />
    );
  }

  if (page === "history") {
    return (
      <History
        entries={history}
        onBack={() => setPage("home")}
        onSelectRecipe={(recipe) => {
          setSelectedRecipe(recipe);
          setRecipeDetailFrom("history");
          setPage("recipeDetail");
        }}
      />
    );
  }

  if (page === "recipeDetail" && selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setPage(recipeDetailFrom)} />;
  }

  return (
    <>
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <Home
        onImageSelected={handleImageSelected}
        onError={setErrorMessage}
        onTryDemo={handleTryDemo}
        onViewHistory={() => setPage("history")}
        hasHistory={history.length > 0}
        demoSet={demoSet}
      />
    </>
  );
}

export default App;
