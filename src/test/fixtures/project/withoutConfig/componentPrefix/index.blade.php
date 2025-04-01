<flux:tabs>
    <flux:tab :disabled="!auth()->user()->can('update', $team)" name="show-types" icon="cog-6-tooth">Test Buttons
    </flux:tab>
</flux:tabs>
