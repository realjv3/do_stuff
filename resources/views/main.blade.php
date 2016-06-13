<!DOCTYPE html>
<html>
<head>
    <title>Invoice This</title>

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link href='https://fonts.googleapis.com/css?family=Alegreya+Sans:400,700' rel='stylesheet' type='text/css'>

    <script src="{{ URL::asset('js/bundle.js') }}" type="text/javascript"></script>
    <script>
        var _token = "{{ csrf_token() }}";
        var loggedin = {{ (Auth::check())? : '0' }};
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.34/browser.min.js"></script>
</head>

<body>
    <header id="appbar"></header>

    <div id="content">
        @yield('content')
    </div>

    <script src="{{ URL::asset('js/main.jsx') }}" type="text/babel"></script>
</body>
</html>