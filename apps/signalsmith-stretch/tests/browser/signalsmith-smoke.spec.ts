import { expect, test, type Page } from "@playwright/test";

test("loads the Signalsmith Stretch meter demo", async ({ page }) => {
  await installAudioProbe(page);
  await page.goto("/");

  await expect(page.locator("#fileName")).toHaveText(
    "signalsmith-demo-loop.wav",
    { timeout: 20_000 },
  );
  await expect(page.locator("#loadedSource")).toHaveText(
    "official Signalsmith demo loop",
  );
  await expect(page.locator("#chooseFile")).toHaveCount(0);
  await expect(page.locator("#waveform")).toHaveCount(0);
  await expect(page.locator("#sourceMeta")).toContainText("browser decoded");
  await expect(page.locator("#sourceMeta")).toContainText(/\d+ch\/\d+Hz/u);
  await expect(page.locator("#sourceMeta")).toContainText(
    "signalsmith-stretch/control-meter-boundary",
  );
  await expect(page.locator("#playButton")).toBeEnabled();
  await expect(page.locator("#seek")).toBeEnabled();

  await setRange(page, "#rate", "1.25");
  await expect(page.locator("#rateValue")).toHaveText("1.250x");
  await setRange(page, "#pitch", "-3");
  await expect(page.locator("#pitchValue")).toHaveText("-3.0 st");

  await page.locator("#formantBaseAuto").uncheck();
  await setRange(page, "#formantBase", "80");
  await expect(page.locator("#formantBaseValue")).toHaveText("80 Hz");

  await page.locator("#playButton").click();
  await expect(page.locator("#runtimeFact")).toHaveText("playing");
  await expect(page.locator("#status")).toContainText("Playing");
  await expect
    .poll(() => outputPeak(page), { timeout: 10_000 })
    .toBeGreaterThan(0.01);
  await expect
    .poll(async () => (await page.locator("#playheadFact").textContent()) ?? "")
    .not.toMatch(/^0:00\.0/u);
  await expect
    .poll(() => publishCount(page), { timeout: 10_000 })
    .toBeGreaterThan(0);
  await expect
    .poll(() => meterReadout(page, "#meterReadoutL"), { timeout: 10_000 })
    .not.toContain("RMS -inf");

  const scrubTarget = await seekMidpoint(page);
  await page.locator("#seek").dispatchEvent("pointerdown", {
    isPrimary: true,
    pointerId: 1,
    pointerType: "mouse",
  });
  await expect(page.locator("#runtimeFact")).toHaveText("ready");
  await expect(page.locator("#status")).toContainText("Seeking");
  await expect
    .poll(() => outputPeak(page), { timeout: 10_000 })
    .toBeLessThan(0.001);
  await setRange(page, "#seek", scrubTarget);
  await expect(page.locator("#seek")).toHaveValue(scrubTarget);
  await expect(page.locator("#runtimeFact")).toHaveText("ready");
  await expect
    .poll(() => outputPeak(page), { timeout: 10_000 })
    .toBeLessThan(0.001);
  await page.locator("#seek").dispatchEvent("pointerup", {
    isPrimary: true,
    pointerId: 1,
    pointerType: "mouse",
  });
  await expect(page.locator("#runtimeFact")).toHaveText("playing");
  await expect
    .poll(() => outputPeak(page), { timeout: 10_000 })
    .toBeGreaterThan(0.01);

  await setRange(page, "#outputGain", "0");
  await expect(page.locator("#outputGainValue")).toHaveText("0.000x");
  await expect
    .poll(() => meterReadout(page, "#meterReadoutL"), { timeout: 10_000 })
    .toContain("RMS -inf");
  await expect
    .poll(() => outputPeak(page), { timeout: 10_000 })
    .toBeLessThan(0.001);

  await page.locator("#pauseButton").click();
  await expect(page.locator("#runtimeFact")).toHaveText("ready");
  await expect(page.locator("#status")).toContainText("Paused");
});

async function installAudioProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__signalsmithAudioProbe = { attached: false };
    const originalConnect = AudioNode.prototype.connect;
    const connect = originalConnect as (
      this: AudioNode,
      destination: AudioNode | AudioParam,
      output?: number,
      input?: number,
    ) => AudioNode | void;

    AudioNode.prototype.connect = function (
      this: AudioNode,
      destination: AudioNode | AudioParam,
      output?: number,
      input?: number,
    ): AudioNode | void {
      const result = connect.call(this, destination, output, input);
      const probe = window.__signalsmithAudioProbe;
      const connectsToDestination =
        destination instanceof AudioDestinationNode;

      if (
        connectsToDestination &&
        this instanceof AudioWorkletNode &&
        probe &&
        !probe.attached
      ) {
        const analyser = this.context.createAnalyser();
        analyser.fftSize = 2048;
        connect.call(this, analyser);
        probe.analyser = analyser;
        probe.attached = true;
      }

      return result;
    } as typeof AudioNode.prototype.connect;
  });
}

async function outputPeak(page: Page): Promise<number> {
  return page.evaluate(() => {
    const analyser = window.__signalsmithAudioProbe?.analyser;
    if (!analyser) {
      return 0;
    }

    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let peak = 0;

    for (const sample of data) {
      peak = Math.max(peak, Math.abs(sample));
    }

    return peak;
  });
}

async function setRange(
  page: Page,
  selector: string,
  value: string,
): Promise<void> {
  await page.locator(selector).evaluate((element, nextValue) => {
    if (!(element instanceof HTMLInputElement)) {
      throw new Error("Expected range input.");
    }

    element.value = nextValue;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function seekMidpoint(page: Page): Promise<string> {
  return page.locator("#seek").evaluate((element) => {
    if (!(element instanceof HTMLInputElement)) {
      throw new Error("Expected seek input.");
    }

    return (Number(element.max) / 2).toFixed(2);
  });
}

async function publishCount(page: Page): Promise<number> {
  const text = (await page.locator("#publishFact").textContent()) ?? "";
  return Number.parseInt(text, 10) || 0;
}

async function meterReadout(page: Page, selector: string): Promise<string> {
  return (await page.locator(selector).textContent()) ?? "";
}

declare global {
  interface Window {
    __signalsmithAudioProbe?: {
      analyser?: AnalyserNode;
      attached: boolean;
    };
  }
}
