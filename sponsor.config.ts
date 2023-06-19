import { defineConfig, presets } from "sponsorkit";

export default defineConfig({
    // includePrivate: true,
    formats: ["png"],
    tiers: [
        {
            title: "Sponsors",
            preset: presets.xl,
            // to insert custom elements after the tier block
            composeAfter: (composer, _tierSponsors, _config) => {
                composer.addSpan(10);
            },
        },
        {
            title: "Past Sponsors",
            monthlyDollars: -1,
            preset: presets.large,
        },
    ],
});
