<div class="z-50 z-10 z-20 justify-center md:text-center container custom-class text-left">
</div>
@foreach ($items as $item)
@switch($item->status)
@case('status')
// Do something
@break
@endswitch
@endforeach
<div class="md:col-end-12 xl:col-end-10 col-start-2 col-end-11 xxxl:col-end-8">
    <h1 class="text-white">Random Stuff</h1>
</div>
