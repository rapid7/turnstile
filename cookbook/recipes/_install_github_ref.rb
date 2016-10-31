#
# Cookbook Name:: turnstile
# Recipe:: _install_github_ref
#
# Copyright (C) 2016 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#
directory node['turnstile']['paths']['directory']

## Fetch and install turnstile
remote_file 'turnstile' do
  source "https://github.com/rapid7/turnstile/archive/#{node['turnstile']['version']}.tar.gz"
  path ::File.join(Chef::Config['file_cache_path'], "turnstile-#{node['turnstile']['version']}.tar.gz")

  action :create_if_missing
  backup false

  notifies :run, 'execute[extract source]', :immediate
end

## Unpack GitHub tarball
execute 'extract source' do
  command ["tar -xzf #{resources('remote_file[turnstile]').path}",
           '--strip-components=1',
           "--directory #{node['turnstile']['paths']['directory']}"].join(' ')

  action ::File.exist?(
    ::File.join(node['turnstile']['paths']['directory'], 'package.json')
  ) ? :nothing : :run

  notifies :run, 'execute[npm install]', :immediate
end

## node-libuuid support
package 'build-essential'
package 'uuid-dev'

## Install module dependencies
execute 'npm install' do
  command '/usr/bin/npm install'
  cwd node['turnstile']['paths']['directory']
  environment 'HOME' => node['turnstile']['paths']['directory']
  action :nothing
end
