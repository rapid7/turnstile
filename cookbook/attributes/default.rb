
default['turnstile']['user'] = 'turnstile'
default['turnstile']['group'] = 'turnstile'

default['turnstile']['paths']['directory'] = '/opt/turnstile'
default['turnstile']['paths']['executable'] = ::File.join(node['turnstile']['paths']['directory'], 'bin/server')
default['turnstile']['paths']['configuration'] = '/etc/turnstile/config.json'

default['turnstile']['config'] = Mash.new
default['turnstile']['version'] = nil
