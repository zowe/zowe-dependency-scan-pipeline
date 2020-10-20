--[[
This program and the accompanying materials are made available under the terms of the
Eclipse Public License v2.0 which accompanies this distribution, and is available at
https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright IBM Corporation 2020
--]]

JSON = (loadfile "JSON.lua")() -- one-time load of the routines

-- Initialize the pseudo random number generator - http://lua-users.org/wiki/MathLibraryTutorial
math.randomseed(os.time())
math.random(); math.random(); math.random()

-- parameters will be passed from preparing step
debug = {{debug}}
json_file = "endpoints.json"

-- check if file exists on the file system
function file_exists(file)
  local f = io.open(file, "rb")
  if f then f:close() end
  return f ~= nil
end

-- read full file content and return as string
function read_file_content(file)
  lines = {}
  for line in io.lines(file) do
    lines[#lines + 1] = line
  end
  return table.concat(lines, "\n")
end

-- caluclate total weight of all http requests
function calculate_total_weight(endpoints)
  local total_weight = 0
  for index, http_request in ipairs(endpoints) do
    local current_weight = 0
    if http_request.weight ~= nil then
      current_weight = http_request.weight
    end
  
    total_weight = total_weight + current_weight
  end

  return total_weight
end

-- randomly select a http request based on the weight defined for each request
function select_http_request(endpoints, total_weight)
  local chance = math.random()
  if debug then
    io.write("[debug][random] " .. chance .. "\n")
  end

  local selected_request
  local range_low = 0
  for index, http_request in ipairs(endpoints) do
    local current_weight = 0
    if http_request.weight ~= nil then
      current_weight = http_request.weight / total_weight
    end
    local range_high = range_low + current_weight
    if chance >= range_low and chance < range_high then
      selected_request = http_request
      break
    end
  
    range_low = range_low + current_weight
  end

  return selected_request
end  

-- read all http requests defined in the json file
if not file_exists(json_file) then
  io.stderr:write("Error: file " .. json_file .. " doesn't exist\n")
  os.exit()
end
local endpoints_text = read_file_content(json_file)
local endpoints = JSON:decode(endpoints_text)
if #endpoints <= 0 then
  io.stderr:write("Error: no paths found in " .. json_file .. "\n")
  os.exit()
end
local total_weight = calculate_total_weight(endpoints)
if debug then
  io.write("[debug]------------------------------\n")
  io.write("[debug] total endpoints: " .. #endpoints .. "\n")
  io.write("[debug]    total weight: " .. total_weight .. "\n")
end

-- handle wrk request, use randomly selected one
request = function()
  if debug then
    io.write("[debug]>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n")
  end

  local selected_request = select_http_request(endpoints, total_weight)

  local path = "/"
  if selected_request.endpoint ~= nil then
    path = selected_request.endpoint
  end

  local method = "GET"
  if selected_request.method ~= nil then
    method = selected_request.method
  end

  local headers = {}
  for key, value in pairs(wrk.headers) do
    headers[key] = value
  end
  if selected_request.headers ~= nil and type(selected_request.headers) == "table" then
    for key, value in pairs(selected_request.headers) do
      headers[key] = value
    end
  end

  local body = ""
  if selected_request.body ~= nil then
    body = selected_request.body
  end

  if debug then
    io.write("[debug][request] " .. method .. " " .. wrk.scheme .. "://" .. wrk.host .. ":" .. wrk.port .. path .. "\n")
    io.write("[debug][request] Headers:\n")
    for key, value in pairs(headers) do
      io.write("[debug][request]  - " .. key  .. ": " .. value .. "\n")
    end
    io.write("[debug][request] Body: " .. body .. "\n")
  end

  return wrk.format(method, path, headers, body)
end

-- debug http response
response = function (status, headers, body)
  if debug then
    io.write("[debug]<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n")
    io.write("[debug][response] Status: " .. status .. "\n")

    io.write("[debug][response] Headers:\n")

    -- Loop through passed arguments
    for key, value in pairs(headers) do
      io.write("[debug][response]  - " .. key  .. ": " .. value .. "\n")
    end

    io.write("[debug][response] Body:\n")
    io.write("[debug][response] " .. body .. "\n")
  end
end
