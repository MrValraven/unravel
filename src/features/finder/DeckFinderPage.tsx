import { useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import { getVisibleDecks } from "../../content/decks";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { FinderResults } from "./components/FinderResults";
import { FinderStep, type FinderStepChoice } from "./components/FinderStep";
import { finderCopy } from "./copy";
import {
  audienceOptions,
  finderStepOrder,
  moodOptions,
  spiceOptions,
  type FinderOption,
} from "./finderSteps";
import { rankDecks, type FinderAnswers } from "./rankDecks";
import "./DeckFinderPage.scss";
import { SiteFooter } from "../../components/SiteFooter";

type StepDirection = "forward" | "back";

const toChoices = <Value extends string>(
  options: FinderOption<Value>[],
  labels: Record<Value, string>
): FinderStepChoice<Value>[] =>
  options.map((option) => ({ ...option, label: labels[option.value] }));

const DeckFinderPage = () => {
  const copy = useCopy(finderCopy);
  useDocumentTitle(copy.documentTitle);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<StepDirection>("forward");
  const [hasNavigated, setHasNavigated] = useState(false);
  const [answers, setAnswers] = useState<Partial<FinderAnswers>>({});
  const totalSteps = finderStepOrder.length;
  const stepName = finderStepOrder[stepIndex];
  const isShowingResults = stepName === undefined;

  const suggestions = useMemo(() => {
    const { audience, mood, spice } = answers;
    if (!isShowingResults || !audience || !mood || !spice) return [];
    return rankDecks(getVisibleDecks(), { audience, mood, spice });
  }, [answers, isShowingResults]);

  const goToStep = (nextIndex: number, nextDirection: StepDirection) => {
    setDirection(nextDirection);
    setHasNavigated(true);
    setStepIndex(nextIndex);
  };

  const answer = <Key extends keyof FinderAnswers>(
    key: Key,
    value: FinderAnswers[Key]
  ) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    goToStep(stepIndex + 1, "forward");
  };

  const renderStep = () => {
    if (stepName === "audience") {
      return (
        <FinderStep
          question={copy.audience.question}
          choices={toChoices(audienceOptions, copy.audience.options)}
          selectedValue={answers.audience}
          onSelect={(value) => answer("audience", value)}
          shouldFocusQuestion={hasNavigated}
        />
      );
    }
    if (stepName === "mood") {
      return (
        <FinderStep
          question={copy.mood.question}
          choices={toChoices(moodOptions, copy.mood.options)}
          selectedValue={answers.mood}
          onSelect={(value) => answer("mood", value)}
          shouldFocusQuestion={hasNavigated}
        />
      );
    }
    if (stepName === "spice") {
      return (
        <FinderStep
          question={copy.spice.question}
          choices={toChoices(spiceOptions, copy.spice.options)}
          selectedValue={answers.spice}
          onSelect={(value) => answer("spice", value)}
          shouldFocusQuestion={hasNavigated}
        />
      );
    }
    return (
      <FinderResults
        suggestions={suggestions}
        onStartOver={() => {
          setAnswers({});
          goToStep(0, "back");
        }}
      />
    );
  };

  return (
    <>
      <div className="page deck-finder">
        <PageHeader
          backTo="/decks"
          backLabel={copy.backLabel}
          title={copy.title}
        />
        <main className="deck-finder__main">
          {!isShowingResults && (
            <div className="deck-finder__progress">
              <p className="deck-finder__step-label">
                {formatCopy(copy.stepProgress, {
                  step: stepIndex + 1,
                  total: totalSteps,
                })}
              </p>
              <div className="deck-finder__track" aria-hidden="true">
                <div
                  className="deck-finder__fill"
                  style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
              {stepIndex > 0 && (
                <button
                  type="button"
                  className="button button--quiet deck-finder__previous"
                  onClick={() => goToStep(stepIndex - 1, "back")}
                >
                  <FiArrowLeft aria-hidden="true" size={18} />
                  {copy.previousStep}
                </button>
              )}
            </div>
          )}
          <div
            key={stepIndex}
            className="deck-finder__stage"
            data-direction={direction}
          >
            {renderStep()}
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  );
};

export default DeckFinderPage;
