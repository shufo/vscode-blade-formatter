<div class="custom-class container z-50 z-10 z-20 justify-center text-left md:text-center">
</div>
@foreach ($items as $item)
    @switch($item->status)
        @case('status')
            // Do something
        @break
    @endswitch
@endforeach
<div class="xxxl:col-end-8 col-start-2 col-end-11 md:col-end-12 xl:col-end-10">
    <h1 class="text-white">Random Stuff</h1>
</div>
