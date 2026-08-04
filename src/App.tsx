import { useState } from "react";
import "./App.css";
import { analyzeFridgeImage } from "./api";
import { AD_GROUP_IDS } from "./adConfig";
import { DEMO_RESULT } from "./demoData";
import { playFullScreenAd } from "./hooks/useFullScreenAd";
import { Analyzing } from "./screens/Analyzing";
import { Home } from "./screens/Home";
import { RecipeDetail } from "./screens/RecipeDetail";
import { Result } from "./screens/Result";
import type { AnalyzeResult, Recipe } from "./types";

type Page = "home" | "analyzing" | "result" | "recipeDetail";

function App() {
  const [page, setPage] = useState<Page>("home");
  const [imageUri, setImageUri] = useState<string>("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);

  const handleImageSelected = async (base64: string) => {
    setImageUri(`data:image/jpeg;base64,${base64}`);
    setIsDemo(false);
    setPage("analyzing");
    setErrorMessage("");

    try {
      const analyzeResult = await analyzeFridgeImage(base64);
      await playFullScreenAd(AD_GROUP_IDS.interstitial);
      setResult(analyzeResult);
      setPage("result");
    } catch {
      setErrorMessage("냉장고 사진을 분석하지 못했어요. 다시 시도해주세요.");
      setPage("home");
    }
  };

  const handleTryDemo = () => {
    setIsDemo(true);
    setResult(DEMO_RESULT);
    setErrorMessage("");
    setPage("result");
  };

  const handleRetake = () => {
    setResult(null);
    setImageUri("");
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
        onRetake={handleRetake}
        onSelectRecipe={(recipe) => {
          setSelectedRecipe(recipe);
          setPage("recipeDetail");
        }}
      />
    );
  }

  if (page === "recipeDetail" && selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setPage("result")} />;
  }

  return (
    <>
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <Home onImageSelected={handleImageSelected} onError={setErrorMessage} onTryDemo={handleTryDemo} />
    </>
  );
}

export default App;
