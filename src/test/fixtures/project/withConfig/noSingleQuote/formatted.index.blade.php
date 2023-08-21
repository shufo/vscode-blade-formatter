@if ($array["it_should_be_keep_double_quote"])
    foo
@endif
@include("common.header")
@include("common.navbar")
@yield("content")
<div class='{{ auth($user["key"]) }}'>
</div>
