'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button, Table, Chip, Input } from '@heroui/react';
import { Plus, Trash2, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { locationSchema, LocationInput } from '../schemas/location.schema';
import { createLocationAction, deleteLocationAction } from '../actions/location.action';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  countryCode: string;
  _count?: {
    servers: number;
  };
}

interface LocationManagementProps {
  initialLocations: Location[];
}

export function LocationManagement({ initialLocations }: LocationManagementProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      countryCode: '',
    }
  });

  const onSubmit = async (data: LocationInput) => {
    const result = await createLocationAction(data);
    if (result.success && result.data) {
      toast.success('Thêm vị trí mới thành công');
      setLocations([result.data, ...locations]);
      setIsModalOpen(false);
      reset();
    } else {
      toast.error(result.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vị trí này?')) return;
    
    setIsDeleting(id);
    const result = await deleteLocationAction(id);
    if (result.success) {
      toast.success('Đã xóa vị trí');
      setLocations(locations.filter(l => l.id !== id));
    } else {
      toast.error(result.message || 'Có lỗi xảy ra');
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Quản lý Vị trí</h1>
          <p className="text-xs text-slate-400">Quản lý danh sách quốc gia và khu vực đặt máy chủ</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onPress={() => setIsModalOpen(true)}
          className="cursor-pointer font-bold text-xs h-9 px-3 flex items-center gap-1.5 self-start sm:self-auto rounded-lg"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Thêm vị trí
        </Button>
      </div>

      {/* Locations Table list */}
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <Table className="w-full text-left border-collapse">
          <Table.ScrollContainer>
            <Table.Content aria-label="Danh sách vị trí">
              <Table.Header className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <Table.Column isRowHeader className="py-2.5 px-3">Tên vị trí</Table.Column>
                <Table.Column className="py-2.5 px-3">Mã QG</Table.Column>
                <Table.Column className="py-2.5 px-3">Sử dụng</Table.Column>
                <Table.Column className="py-2.5 px-3 text-right">Thao tác</Table.Column>
              </Table.Header>
              <Table.Body className="divide-y divide-slate-100 text-xs">
                {locations.map((loc) => (
                  <Table.Row key={loc.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0">
                    <Table.Cell className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Image 
                          src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${loc.countryCode.toUpperCase()}.svg`} 
                          width={18} 
                          height={12}
                          alt={loc.countryCode}
                          style={{ 
                            borderRadius: '1px', 
                            border: '1px solid #E2E8F0',
                            display: 'block' 
                          }}
                        />
                        <span className="font-semibold text-slate-700">{loc.name}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3">
                      <Chip size="sm" variant="soft" color="accent" className="font-bold text-[10px] uppercase">
                        {loc.countryCode}
                      </Chip>
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 font-semibold text-slate-500">
                      {loc._count?.servers || 0} máy chủ
                    </Table.Cell>
                    <Table.Cell className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDelete(loc.id)}
                        disabled={isDeleting === loc.id}
                        className="inline-flex items-center justify-center p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg cursor-pointer transition-colors"
                        title="Xóa vị trí"
                      >
                        {isDeleting === loc.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {locations.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                      Danh sách vị trí hiện đang trống.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* Modern Compact Overlay Modal for Add Location */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm overflow-hidden shadow-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                Thêm vị trí mới
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3.5 text-xs bg-white">
              {/* Tên vị trí */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Tên vị trí</label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="Ví dụ: Việt Nam, Hoa Kỳ..."
                      value={field.value}
                      onChange={field.onChange}
                      className={`w-full h-9 px-2.5 text-xs bg-white border rounded-lg outline-none transition-all duration-150 ${
                        errors.name 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                          : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                      }`}
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-[10px] text-red-500 font-semibold">{errors.name.message}</p>
                )}
              </div>

              {/* Mã quốc gia */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-500">Mã quốc gia (ISO 3166-1 alpha-2)</label>
                <Controller
                  name="countryCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="VN, US, UK, SG..."
                      value={field.value}
                      onChange={field.onChange}
                      className={`w-full h-9 px-2.5 text-xs bg-white border rounded-lg outline-none transition-all duration-150 ${
                        errors.countryCode 
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50' 
                          : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                      }`}
                    />
                  )}
                />
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Sử dụng 2 ký tự mã quốc gia để hiển thị icon cờ tự động.
                </p>
                {errors.countryCode && (
                  <p className="mt-1 text-[10px] text-red-500 font-semibold">{errors.countryCode.message}</p>
                )}
              </div>
            </form>
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <Button
                size="sm"
                onPress={() => setIsModalOpen(false)}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-600"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={() => handleSubmit(onSubmit)()}
                isDisabled={isSubmitting}
                className="cursor-pointer font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
              >
                {isSubmitting && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                Lưu vị trí
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
