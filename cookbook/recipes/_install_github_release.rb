#
# Cookbook Name:: turnstile
# Recipe:: _install_github_release
#
# Copyright (C) 2017 Rapid7 LLC.
#
# Distributed under terms of the MIT License. All rights not explicitly granted
# in the MIT license are reserved. See the included LICENSE file for more details.
#

## Fetch and install turnstile
remote_file 'turnstile' do
  source Turnstile::Helpers.github_download('rapid7', 'turnstile', node['turnstile']['version'])
  path ::File.join(Chef::Config['file_cache_path'], "turnstile-#{node['turnstile']['version']}.deb")

  action :create_if_missing
  backup false
end

package 'turnstile' do
  source resources('remote_file[turnstile]').path
  provider Chef::Provider::Package::Dpkg
  version node['turnstile']['version']
end
