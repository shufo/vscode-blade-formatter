@extends('frontend.layouts.app')
@section('head')
@endsection
@section('title') foo
@endsection
@section('content')
    <section id="content">
        <div
            class="container mod-users-pd-h">
            <div class="pf-user-header">
                <div></div>
                <p>@lang('users.index')</p>
            </div>
            <div class="pf-users-branch">
                <ul
                    class="pf-users-branch__list">
                    @foreach ($tree as $users)
                        <li>
                            <img src="{{ asset('img/frontend/icon/branch-arrow.svg') }}"
                                alt="branch_arrow">
                            {{ link_to_route('frontend.users.user.show', $users['name'], $users['_id']) }}
                        </li>
                    @endforeach
                </ul>
                <div
                    class="pf-users-branch__btn">
                    @can('create',
                        App\Models\User::class)
                        {!! link_to_route(
                            'frontend.users.user.create',
                            __('users.create'),
                            [],
                            ['class' => 'btn'],
                        ) !!}
                    @endcan
                </div>
            </div>
        </div>
    </section>
@endsection
@section('footer')
@stop
