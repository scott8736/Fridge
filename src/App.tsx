import { useEffect, useState } from "react";
import "./App.css";
import { analyzeFridgeImage, analyzeIngredients, recommendTodayMenu } from "./api";
import { logClick, logImpression, logScreen } from "./analytics";
import { AD_GROUP_IDS, INTERSTITIAL_SESSION_CAP } from "./adConfig";
import { pickRandomDemoSet } from "./demoData";
import { loadFavorites } from "./favorites";
import { addHistoryEntry, loadHistory, type HistoryEntry } from "./history";
import { playFullScreenAd, preloadFullScreenAd } from "./hooks/useFullScreenAd";
import { Analyzing } from "./screens/Analyzing";
import { Favorites } from "./screens/Favorites";
import { History } from "./screens/History";
import { Home } from "./screens/Home";
import { ManualInput } from "./screens/ManualInput";
import { RecipeDetail } from "./screens/RecipeDetail";
import { Result } from "./screens/Result";
import type { AnalysisSource, AnalyzeResult, Recipe } from "./types";

type Page = "home" | "analyzing" | "result" | "recipeDetail" | "history" | "favorites" | "manualInput";
type RecipeDetailOrigin = "result" | "history" | "favorites";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [imageUri, setImageUri] = useState<string>("");
  const [source, setSource] = useState<AnalysisSource | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetailFrom, setRecipeDetailFrom] = useState<RecipeDetailOrigin>("result");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);
  /** AI 분석이 실패해서 예시 레시피로 대신 보여주는 중인지 */
  const [isFallback, setIsFallback] = useState(false);
  const [interstitialShownCount, setInterstitialShownCount] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  // 방문마다 한 번만 랜덤으로 뽑아서, 홈 미리보기와 실제 체험 화면이 같은 세트를 보여주게 해요.
  const [demoSet] = useState(() => pickRandomDemoSet());

  useEffect(() => {
    loadHistory().then(setHistory);
    loadFavorites().then(setFavorites);
  }, []);

  useEffect(() => {
    logScreen(`screen_${page}`);
  }, [page]);

  const runAnalysis = async (source: AnalysisSource, run: () => Promise<AnalyzeResult>) => {
    setSource(source);
    setIsDemo(false);
    setIsFallback(false);
    setPage("analyzing");
    const startedAt = Date.now();
    setErrorMessage("");

    // 세션당 노출 상한 안에 있을 때만, AI 분석과 동시에 미리 로드해서 대기시간을 겹쳐 써요.
    const willShowInterstitial = interstitialShownCount < INTERSTITIAL_SESSION_CAP;
    if (willShowInterstitial) preloadFullScreenAd(AD_GROUP_IDS.interstitial);

    try {
      const analyzeResult = await run();
      logImpression("analysis_success", {
        source: source.type,
        seconds: Math.round((Date.now() - startedAt) / 1000),
        recipes: analyzeResult.recipes.length,
      });
      if (willShowInterstitial) {
        // 광고 노출이 실패해도 레시피 추천 자체는 반드시 이어져야 해요.
        try {
          await playFullScreenAd(AD_GROUP_IDS.interstitial);
        } catch {
          // 무시
        }
        setInterstitialShownCount((count) => count + 1);
      }
      setResult(analyzeResult);
      setPage("result");
      addHistoryEntry(analyzeResult).then(setHistory);
    } catch {
      // 빈손으로 홈에 돌려보내지 않고, 예시 레시피를 "예시"라고 밝힌 채 보여줘요.
      logImpression("analysis_fail", { source: source.type, seconds: Math.round((Date.now() - startedAt) / 1000) });
      setIsDemo(true);
      setIsFallback(true);
      setSource(null);
      setResult(demoSet.result);
      setPage("result");
    }
  };

  const handleImageSelected = (base64: string) => {
    logClick("start_analysis", { source: "image" });
    setImageUri(`data:image/jpeg;base64,${base64}`);
    runAnalysis({ type: "image", base64 }, () => analyzeFridgeImage(base64));
  };

  const handleManualSubmit = (ingredients: string[]) => {
    logClick("start_analysis", { source: "text", count: ingredients.length });
    setImageUri("");
    runAnalysis({ type: "text", ingredients }, () => analyzeIngredients(ingredients));
  };

  const handleTodayMenu = () => {
    logClick("start_analysis", { source: "today" });
    setImageUri("");
    runAnalysis({ type: "today" }, () => recommendTodayMenu());
  };

  const handleTryDemo = () => {
    logClick("try_demo");
    setIsDemo(true);
    setIsFallback(false);
    setSource(null);
    setResult(demoSet.result);
    setErrorMessage("");
    setPage("result");
  };

  const handleRetake = () => {
    setResult(null);
    setImageUri("");
    setSource(null);
    setIsDemo(false);
    setIsFallback(false);
    setPage("home");
  };

  const goToRecipeDetail = (recipe: Recipe, from: RecipeDetailOrigin) => {
    logClick("open_recipe", { from, demo: isDemo });
    setSelectedRecipe(recipe);
    setRecipeDetailFrom(from);
    setPage("recipeDetail");
  };

  if (page === "analyzing") {
    return <Analyzing imageUri={imageUri} sourceType={source?.type ?? "image"} />;
  }

  if (page === "manualInput") {
    return <ManualInput onSubmit={handleManualSubmit} onBack={() => setPage("home")} />;
  }

  if (page === "result" && result) {
    return (
      <Result
        result={result}
        isDemo={isDemo}
        isFallback={isFallback}
        demoLabel={demoSet.label}
        source={isDemo ? undefined : (source ?? undefined)}
        onRetake={handleRetake}
        onSelectRecipe={(recipe) => goToRecipeDetail(recipe, "result")}
      />
    );
  }

  if (page === "history") {
    return (
      <History
        entries={history}
        onBack={() => setPage("home")}
        onSelectRecipe={(recipe) => goToRecipeDetail(recipe, "history")}
      />
    );
  }

  if (page === "favorites") {
    return (
      <Favorites
        favorites={favorites}
        onBack={() => setPage("home")}
        onSelectRecipe={(recipe) => goToRecipeDetail(recipe, "favorites")}
      />
    );
  }

  if (page === "recipeDetail" && selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => {
          if (recipeDetailFrom === "favorites") loadFavorites().then(setFavorites);
          setPage(recipeDetailFrom);
        }}
      />
    );
  }

  return (
    <>
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <Home
        onImageSelected={handleImageSelected}
        onError={setErrorMessage}
        onTryDemo={handleTryDemo}
        onManualInput={() => setPage("manualInput")}
        onTodayMenu={handleTodayMenu}
        onViewHistory={() => setPage("history")}
        onViewFavorites={() => setPage("favorites")}
        hasHistory={history.length > 0}
        hasFavorites={favorites.length > 0}
        demoSet={demoSet}
      />
    </>
  );
}

export default App;
