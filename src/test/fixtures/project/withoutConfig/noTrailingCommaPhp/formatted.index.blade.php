{!! Form::select(
    'refundType',
    REFUND_TYPES,
    $data->refundType ?? null,
    [
        'class' => 'form-control refundType',
        'required' => 'required'
    ] + ($refundId ? ['disabled' => 'true'] : [])
) !!}
