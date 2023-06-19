import { defineConfig, presets } from "sponsorkit";

export default defineConfig({
    // includePrivate: true,
    tiers: [
        {
            title: "Sponsors",
            preset: presets.large,
            // to insert custom elements after the tier block
            composeAfter: (composer, _tierSponsors, _config) => {
                composer.addSpan(10);
            },
        },
        {
            title: "Past Sponsors",
            monthlyDollars: -1,
            preset: presets.medium,
        },
    ],
});
