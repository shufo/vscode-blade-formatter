<div class="custom-class container z-50 z-10 z-20 justify-center text-left md:text-center">
</div>
@foreach ($items as $item)
    @switch($item->status)
        @case('status')
            // Do something
        @break
    @endswitch
@endforeach
